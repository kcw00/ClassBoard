import { Handler, ScheduledEvent } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const prisma = new PrismaClient();
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

interface AttendanceReport {
  classId: string;
  className: string;
  totalSessions: number;
  averageAttendance: number;
  studentAttendance: Array<{
    studentId: string;
    studentName: string;
    attendanceRate: number;
    totalPresent: number;
    totalAbsent: number;
  }>;
}

interface PerformanceReport {
  classId: string;
  className: string;
  averageGrade: number;
  totalTests: number;
  studentPerformance: Array<{
    studentId: string;
    studentName: string;
    averageScore: number;
    averagePercentage: number;
    letterGrade: string;
    totalTests: number;
  }>;
}

interface ReportGeneratorResponse {
  statusCode: number;
  body: string;
}

export const handler: Handler<ScheduledEvent, ReportGeneratorResponse> = async (event) => {
  console.log('Starting report generation', { event });

  try {
    const reportDate = new Date();
    const reportMonth = reportDate.getMonth();
    const reportYear = reportDate.getFullYear();

    // Generate attendance reports
    const attendanceReports = await generateAttendanceReports(reportMonth, reportYear);
    
    // Generate performance reports
    const performanceReports = await generatePerformanceReports(reportMonth, reportYear);

    // Upload reports to S3
    await uploadReportsToS3(attendanceReports, performanceReports, reportDate);

    console.log(`Successfully generated ${attendanceReports.length} attendance reports and ${performanceReports.length} performance reports`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Report generation completed successfully',
        attendanceReportsCount: attendanceReports.length,
        performanceReportsCount: performanceReports.length,
        reportDate: reportDate.toISOString(),
      }),
    };
  } catch (error) {
    console.error('Error in report generation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

async function generateAttendanceReports(month: number, year: number): Promise<AttendanceReport[]> {
  const classes = await prisma.class.findMany({
    include: {
      enrollments: {
        include: {
          student: true,
        },
      },
      attendanceRecords: {
        where: {
          date: {
            gte: new Date(year, month, 1),
            lt: new Date(year, month + 1, 1),
          },
        },
        include: {
          student: true,
        },
      },
    },
  });

  const reports: AttendanceReport[] = [];

  for (const classItem of classes) {
    const totalSessions = await prisma.attendanceRecord.count({
      where: {
        classId: classItem.id,
        date: {
          gte: new Date(year, month, 1),
          lt: new Date(year, month + 1, 1),
        },
      },
      distinct: ['date'],
    });

    const studentAttendance = [];
    
    for (const enrollment of classItem.enrollments) {
      const studentRecords = classItem.attendanceRecords.filter(
        record => record.studentId === enrollment.studentId
      );
      
      const totalPresent = studentRecords.filter(record => record.status === 'present').length;
      const totalAbsent = studentRecords.filter(record => record.status === 'absent').length;
      const attendanceRate = totalSessions > 0 ? (totalPresent / totalSessions) * 100 : 0;

      studentAttendance.push({
        studentId: enrollment.studentId,
        studentName: enrollment.student.name,
        attendanceRate,
        totalPresent,
        totalAbsent,
      });
    }

    const averageAttendance = studentAttendance.length > 0
      ? studentAttendance.reduce((sum, student) => sum + student.attendanceRate, 0) / studentAttendance.length
      : 0;

    reports.push({
      classId: classItem.id,
      className: classItem.name,
      totalSessions,
      averageAttendance,
      studentAttendance,
    });
  }

  return reports;
}

async function generatePerformanceReports(month: number, year: number): Promise<PerformanceReport[]> {
  const classes = await prisma.class.findMany({
    include: {
      enrollments: {
        include: {
          student: true,
        },
      },
      tests: {
        where: {
          testDate: {
            gte: new Date(year, month, 1),
            lt: new Date(year, month + 1, 1),
          },
        },
        include: {
          testResults: {
            include: {
              student: true,
            },
          },
        },
      },
    },
  });

  const reports: PerformanceReport[] = [];

  for (const classItem of classes) {
    const allResults = classItem.tests.flatMap(test => test.testResults);
    const averageGrade = allResults.length > 0
      ? allResults.reduce((sum, result) => sum + (result.percentage || 0), 0) / allResults.length
      : 0;

    const studentPerformance = [];

    for (const enrollment of classItem.enrollments) {
      const studentResults = allResults.filter(result => result.studentId === enrollment.studentId);
      
      if (studentResults.length > 0) {
        const averageScore = studentResults.reduce((sum, result) => sum + result.score, 0) / studentResults.length;
        const averagePercentage = studentResults.reduce((sum, result) => sum + (result.percentage || 0), 0) / studentResults.length;
        const letterGrade = calculateLetterGrade(averagePercentage);

        studentPerformance.push({
          studentId: enrollment.studentId,
          studentName: enrollment.student.name,
          averageScore,
          averagePercentage,
          letterGrade,
          totalTests: studentResults.length,
        });
      }
    }

    reports.push({
      classId: classItem.id,
      className: classItem.name,
      averageGrade,
      totalTests: classItem.tests.length,
      studentPerformance,
    });
  }

  return reports;
}

async function uploadReportsToS3(
  attendanceReports: AttendanceReport[],
  performanceReports: PerformanceReport[],
  reportDate: Date
): Promise<void> {
  const bucketName = process.env.S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('S3_BUCKET_NAME environment variable is required');
  }

  const dateString = reportDate.toISOString().split('T')[0];

  // Upload attendance reports
  const attendanceKey = `reports/attendance/${dateString}/attendance-report.json`;
  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: attendanceKey,
    Body: JSON.stringify(attendanceReports, null, 2),
    ContentType: 'application/json',
  }));

  // Upload performance reports
  const performanceKey = `reports/performance/${dateString}/performance-report.json`;
  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: performanceKey,
    Body: JSON.stringify(performanceReports, null, 2),
    ContentType: 'application/json',
  }));

  console.log(`Reports uploaded to S3: ${attendanceKey}, ${performanceKey}`);
}

function calculateLetterGrade(percentage: number): string {
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
}