import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/database';
import CacheService from './cacheService';

/**
 * Service for implementing lazy loading and data prefetching strategies
 */
export class LazyLoadingService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Prefetch related data for classes to avoid N+1 queries
   */
  async prefetchClassData(classIds: string[]): Promise<void> {
    if (classIds.length === 0) return;

    try {
      // Prefetch in parallel for better performance
      await Promise.all([
        this.prefetchClassEnrollments(classIds),
        this.prefetchClassTests(classIds),
        this.prefetchClassHomework(classIds),
        this.prefetchClassAttendance(classIds)
      ]);
    } catch (error) {
      console.error('Error prefetching class data:', error);
      // Don't throw error - prefetching is optional
    }
  }

  /**
   * Prefetch class enrollments and cache them
   */
  private async prefetchClassEnrollments(classIds: string[]): Promise<void> {
    const enrollments = await this.prisma.classEnrollment.findMany({
      where: {
        classId: { in: classIds }
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            grade: true
          }
        }
      }
    });

    // Group by class ID and cache
    const enrollmentsByClass = new Map<string, any[]>();
    enrollments.forEach(enrollment => {
      const classId = enrollment.classId;
      if (!enrollmentsByClass.has(classId)) {
        enrollmentsByClass.set(classId, []);
      }
      enrollmentsByClass.get(classId)!.push(enrollment);
    });

    // Cache each class's enrollments
    enrollmentsByClass.forEach((classEnrollments, classId) => {
      const cacheKey = `class-enrollments:${classId}`;
      CacheService.set('classes', cacheKey, classEnrollments);
    });
  }

  /**
   * Prefetch recent tests for classes
   */
  private async prefetchClassTests(classIds: string[]): Promise<void> {
    const tests = await this.prisma.test.findMany({
      where: {
        classId: { in: classIds }
      },
      orderBy: {
        testDate: 'desc'
      },
      take: 5 * classIds.length, // Get top 5 per class (approximately)
      include: {
        _count: {
          select: { results: true }
        }
      }
    });

    // Group by class ID and cache
    const testsByClass = new Map<string, any[]>();
    tests.forEach(test => {
      const classId = test.classId;
      if (!testsByClass.has(classId)) {
        testsByClass.set(classId, []);
      }
      testsByClass.get(classId)!.push(test);
    });

    // Cache each class's tests (limit to 5 per class)
    testsByClass.forEach((classTests, classId) => {
      const limitedTests = classTests.slice(0, 5);
      const cacheKey = `class-recent-tests:${classId}`;
      CacheService.set('tests', cacheKey, limitedTests);
    });
  }

  /**
   * Prefetch recent homework for classes
   */
  private async prefetchClassHomework(classIds: string[]): Promise<void> {
    const homework = await this.prisma.homeworkAssignment.findMany({
      where: {
        classId: { in: classIds }
      },
      orderBy: {
        dueDate: 'desc'
      },
      take: 5 * classIds.length, // Get top 5 per class (approximately)
      include: {
        _count: {
          select: { submissions: true }
        }
      }
    });

    // Group by class ID and cache
    const homeworkByClass = new Map<string, any[]>();
    homework.forEach(hw => {
      const classId = hw.classId;
      if (!homeworkByClass.has(classId)) {
        homeworkByClass.set(classId, []);
      }
      homeworkByClass.get(classId)!.push(hw);
    });

    // Cache each class's homework (limit to 5 per class)
    homeworkByClass.forEach((classHomework, classId) => {
      const limitedHomework = classHomework.slice(0, 5);
      const cacheKey = `class-recent-homework:${classId}`;
      CacheService.set('homework', cacheKey, limitedHomework);
    });
  }

  /**
   * Prefetch recent attendance for classes
   */
  private async prefetchClassAttendance(classIds: string[]): Promise<void> {
    const attendance = await this.prisma.attendanceRecord.findMany({
      where: {
        classId: { in: classIds }
      },
      orderBy: {
        date: 'desc'
      },
      take: 10 * classIds.length, // Get top 10 per class (approximately)
      include: {
        _count: {
          select: { attendanceData: true }
        }
      }
    });

    // Group by class ID and cache
    const attendanceByClass = new Map<string, any[]>();
    attendance.forEach(record => {
      const classId = record.classId;
      if (!attendanceByClass.has(classId)) {
        attendanceByClass.set(classId, []);
      }
      attendanceByClass.get(classId)!.push(record);
    });

    // Cache each class's attendance (limit to 10 per class)
    attendanceByClass.forEach((classAttendance, classId) => {
      const limitedAttendance = classAttendance.slice(0, 10);
      const cacheKey = `class-recent-attendance:${classId}`;
      CacheService.set('attendance', cacheKey, limitedAttendance);
    });
  }

  /**
   * Prefetch student performance data
   */
  async prefetchStudentPerformance(studentIds: string[]): Promise<void> {
    if (studentIds.length === 0) return;

    try {
      await Promise.all([
        this.prefetchStudentTestResults(studentIds),
        this.prefetchStudentHomeworkSubmissions(studentIds),
        this.prefetchStudentAttendance(studentIds)
      ]);
    } catch (error) {
      console.error('Error prefetching student performance data:', error);
    }
  }

  /**
   * Prefetch student test results
   */
  private async prefetchStudentTestResults(studentIds: string[]): Promise<void> {
    const testResults = await this.prisma.testResult.findMany({
      where: {
        studentId: { in: studentIds }
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            testDate: true,
            testType: true,
            class: {
              select: {
                name: true,
                subject: true
              }
            }
          }
        }
      },
      orderBy: {
        test: {
          testDate: 'desc'
        }
      },
      take: 20 * studentIds.length // Recent results per student
    });

    // Group by student ID and cache
    const resultsByStudent = new Map<string, any[]>();
    testResults.forEach(result => {
      const studentId = result.studentId;
      if (!resultsByStudent.has(studentId)) {
        resultsByStudent.set(studentId, []);
      }
      resultsByStudent.get(studentId)!.push(result);
    });

    // Cache each student's test results
    resultsByStudent.forEach((studentResults, studentId) => {
      const cacheKey = `student-test-results:${studentId}`;
      CacheService.set('tests', cacheKey, studentResults.slice(0, 20));
    });
  }

  /**
   * Prefetch student homework submissions
   */
  private async prefetchStudentHomeworkSubmissions(studentIds: string[]): Promise<void> {
    const submissions = await this.prisma.homeworkSubmission.findMany({
      where: {
        studentId: { in: studentIds }
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            dueDate: true,
            totalPoints: true,
            class: {
              select: {
                name: true,
                subject: true
              }
            }
          }
        }
      },
      orderBy: {
        assignment: {
          dueDate: 'desc'
        }
      },
      take: 20 * studentIds.length // Recent submissions per student
    });

    // Group by student ID and cache
    const submissionsByStudent = new Map<string, any[]>();
    submissions.forEach(submission => {
      const studentId = submission.studentId;
      if (!submissionsByStudent.has(studentId)) {
        submissionsByStudent.set(studentId, []);
      }
      submissionsByStudent.get(studentId)!.push(submission);
    });

    // Cache each student's homework submissions
    submissionsByStudent.forEach((studentSubmissions, studentId) => {
      const cacheKey = `student-homework-submissions:${studentId}`;
      CacheService.set('homework', cacheKey, studentSubmissions.slice(0, 20));
    });
  }

  /**
   * Prefetch student attendance records
   */
  private async prefetchStudentAttendance(studentIds: string[]): Promise<void> {
    const attendanceEntries = await this.prisma.attendanceEntry.findMany({
      where: {
        studentId: { in: studentIds }
      },
      include: {
        attendanceRecord: {
          select: {
            id: true,
            date: true,
            class: {
              select: {
                name: true,
                subject: true
              }
            }
          }
        }
      },
      orderBy: {
        attendanceRecord: {
          date: 'desc'
        }
      },
      take: 30 * studentIds.length // Recent attendance per student
    });

    // Group by student ID and cache
    const attendanceByStudent = new Map<string, any[]>();
    attendanceEntries.forEach(entry => {
      const studentId = entry.studentId;
      if (!attendanceByStudent.has(studentId)) {
        attendanceByStudent.set(studentId, []);
      }
      attendanceByStudent.get(studentId)!.push(entry);
    });

    // Cache each student's attendance
    attendanceByStudent.forEach((studentAttendance, studentId) => {
      const cacheKey = `student-attendance:${studentId}`;
      CacheService.set('attendance', cacheKey, studentAttendance.slice(0, 30));
    });
  }

  /**
   * Lazy load class overview data with intelligent prefetching
   */
  async lazyLoadClassOverview(classId: string): Promise<{
    basicInfo: any;
    enrollments?: any[];
    recentTests?: any[];
    recentHomework?: any[];
    recentAttendance?: any[];
  }> {
    // Always load basic class info first
    const basicInfo = await this.prisma.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        name: true,
        subject: true,
        description: true,
        room: true,
        capacity: true,
        color: true,
        createdDate: true,
        _count: {
          select: {
            enrollments: true,
            tests: true,
            homeworkAssignments: true,
            attendanceRecords: true
          }
        }
      }
    });

    if (!basicInfo) {
      throw new Error('Class not found');
    }

    // Check cache for additional data
    const enrollmentsKey = `class-enrollments:${classId}`;
    const testsKey = `class-recent-tests:${classId}`;
    const homeworkKey = `class-recent-homework:${classId}`;
    const attendanceKey = `class-recent-attendance:${classId}`;

    const cachedEnrollments = CacheService.get('classes', enrollmentsKey);
    const cachedTests = CacheService.get('tests', testsKey);
    const cachedHomework = CacheService.get('homework', homeworkKey);
    const cachedAttendance = CacheService.get('attendance', attendanceKey);

    // Start prefetching missing data in background
    if (!cachedEnrollments || !cachedTests || !cachedHomework || !cachedAttendance) {
      // Don't await - let it run in background
      this.prefetchClassData([classId]).catch(console.error);
    }

    return {
      basicInfo,
      enrollments: cachedEnrollments as any[] | undefined,
      recentTests: cachedTests as any[] | undefined,
      recentHomework: cachedHomework as any[] | undefined,
      recentAttendance: cachedAttendance as any[] | undefined
    };
  }

  /**
   * Preload data for upcoming requests based on usage patterns
   */
  async preloadPopularData(): Promise<void> {
    try {
      // Get most accessed classes (this would typically come from analytics)
      const popularClasses = await this.prisma.class.findMany({
        orderBy: {
          createdAt: 'desc' // Simple heuristic - newer classes are likely more active
        },
        take: 10,
        select: { id: true }
      });

      const classIds = popularClasses.map(c => c.id);
      
      // Prefetch data for popular classes
      await this.prefetchClassData(classIds);

      // Get active students (students with recent activity)
      const activeStudents = await this.prisma.student.findMany({
        where: {
          enrollments: {
            some: {
              class: {
                id: { in: classIds }
              }
            }
          }
        },
        take: 50,
        select: { id: true }
      });

      const studentIds = activeStudents.map(s => s.id);
      
      // Prefetch data for active students
      await this.prefetchStudentPerformance(studentIds);

      console.log(`Preloaded data for ${classIds.length} classes and ${studentIds.length} students`);
    } catch (error) {
      console.error('Error preloading popular data:', error);
    }
  }
}

export default new LazyLoadingService();