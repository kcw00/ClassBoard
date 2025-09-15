import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/database';

/**
 * Service for optimized database queries with batching and efficient data loading
 */
export class QueryOptimizationService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Batch load students for multiple classes to avoid N+1 queries
   */
  async batchLoadClassStudents(classIds: string[]): Promise<Map<string, any[]>> {
    if (classIds.length === 0) return new Map();

    const enrollments = await this.prisma.classEnrollment.findMany({
      where: {
        classId: { in: classIds }
      },
      include: {
        student: true
      },
      orderBy: {
        student: {
          name: 'asc'
        }
      }
    });

    // Group students by class ID
    const studentsByClass = new Map<string, any[]>();
    
    enrollments.forEach(enrollment => {
      const classId = enrollment.classId;
      if (!studentsByClass.has(classId)) {
        studentsByClass.set(classId, []);
      }
      studentsByClass.get(classId)!.push(enrollment.student);
    });

    return studentsByClass;
  }

  /**
   * Batch load test results for multiple tests to avoid N+1 queries
   */
  async batchLoadTestResults(testIds: string[]): Promise<Map<string, any[]>> {
    if (testIds.length === 0) return new Map();

    const results = await this.prisma.testResult.findMany({
      where: {
        testId: { in: testIds }
      },
      include: {
        student: true
      },
      orderBy: {
        student: {
          name: 'asc'
        }
      }
    });

    // Group results by test ID
    const resultsByTest = new Map<string, any[]>();
    
    results.forEach(result => {
      const testId = result.testId;
      if (!resultsByTest.has(testId)) {
        resultsByTest.set(testId, []);
      }
      resultsByTest.get(testId)!.push(result);
    });

    return resultsByTest;
  }

  /**
   * Batch load homework submissions for multiple assignments
   */
  async batchLoadHomeworkSubmissions(assignmentIds: string[]): Promise<Map<string, any[]>> {
    if (assignmentIds.length === 0) return new Map();

    const submissions = await this.prisma.homeworkSubmission.findMany({
      where: {
        assignmentId: { in: assignmentIds }
      },
      include: {
        student: true
      },
      orderBy: {
        student: {
          name: 'asc'
        }
      }
    });

    // Group submissions by assignment ID
    const submissionsByAssignment = new Map<string, any[]>();
    
    submissions.forEach(submission => {
      const assignmentId = submission.assignmentId;
      if (!submissionsByAssignment.has(assignmentId)) {
        submissionsByAssignment.set(assignmentId, []);
      }
      submissionsByAssignment.get(assignmentId)!.push(submission);
    });

    return submissionsByAssignment;
  }

  /**
   * Batch load class enrollments for multiple students
   */
  async batchLoadStudentClasses(studentIds: string[]): Promise<Map<string, any[]>> {
    if (studentIds.length === 0) return new Map();

    const enrollments = await this.prisma.classEnrollment.findMany({
      where: {
        studentId: { in: studentIds }
      },
      include: {
        class: true
      },
      orderBy: {
        class: {
          name: 'asc'
        }
      }
    });

    // Group classes by student ID
    const classesByStudent = new Map<string, any[]>();
    
    enrollments.forEach(enrollment => {
      const studentId = enrollment.studentId;
      if (!classesByStudent.has(studentId)) {
        classesByStudent.set(studentId, []);
      }
      classesByStudent.get(studentId)!.push(enrollment.class);
    });

    return classesByStudent;
  }

  /**
   * Optimized query to get class overview with all related data in minimal queries
   */
  async getClassOverview(classId: string) {
    // Use a single transaction to ensure consistency
    return await this.prisma.$transaction(async (tx) => {
      // Get class basic info
      const classInfo = await tx.class.findUnique({
        where: { id: classId },
        include: {
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

      if (!classInfo) {
        throw new Error('Class not found');
      }

      // Get recent tests (last 5)
      const recentTests = await tx.test.findMany({
        where: { classId },
        orderBy: { testDate: 'desc' },
        take: 5,
        include: {
          _count: {
            select: { results: true }
          }
        }
      });

      // Get recent homework (last 5)
      const recentHomework = await tx.homeworkAssignment.findMany({
        where: { classId },
        orderBy: { dueDate: 'desc' },
        take: 5,
        include: {
          _count: {
            select: { submissions: true }
          }
        }
      });

      // Get recent attendance (last 10 records)
      const recentAttendance = await tx.attendanceRecord.findMany({
        where: { classId },
        orderBy: { date: 'desc' },
        take: 10,
        include: {
          _count: {
            select: { attendanceData: true }
          }
        }
      });

      return {
        class: classInfo,
        recentTests,
        recentHomework,
        recentAttendance
      };
    });
  }

  /**
   * Optimized query to get student performance summary
   */
  async getStudentPerformanceSummary(studentId: string, classId?: string) {
    const whereClause = classId ? { classId } : {};

    return await this.prisma.$transaction(async (tx) => {
      // Get test results with class info
      const testResults = await tx.testResult.findMany({
        where: {
          studentId,
          test: whereClause
        },
        include: {
          test: {
            select: {
              id: true,
              title: true,
              testDate: true,
              testType: true,
              classId: true,
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
        }
      });

      // Get homework submissions with assignment info
      const homeworkSubmissions = await tx.homeworkSubmission.findMany({
        where: {
          studentId,
          assignment: whereClause
        },
        include: {
          assignment: {
            select: {
              id: true,
              title: true,
              dueDate: true,
              totalPoints: true,
              classId: true,
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
        }
      });

      // Calculate performance statistics
      const testStats = this.calculateTestStatistics(testResults);
      const homeworkStats = this.calculateHomeworkStatistics(homeworkSubmissions);

      return {
        testResults,
        homeworkSubmissions,
        statistics: {
          tests: testStats,
          homework: homeworkStats
        }
      };
    });
  }

  /**
   * Calculate test performance statistics
   */
  private calculateTestStatistics(testResults: any[]) {
    if (testResults.length === 0) {
      return {
        totalTests: 0,
        averageScore: 0,
        averagePercentage: 0,
        gradeDistribution: {}
      };
    }

    const totalScore = testResults.reduce((sum, result) => sum + result.score, 0);
    const totalMaxScore = testResults.reduce((sum, result) => sum + result.maxScore, 0);
    const totalPercentage = testResults.reduce((sum, result) => sum + result.percentage, 0);

    // Grade distribution
    const gradeDistribution: Record<string, number> = {};
    testResults.forEach(result => {
      gradeDistribution[result.grade] = (gradeDistribution[result.grade] || 0) + 1;
    });

    return {
      totalTests: testResults.length,
      averageScore: Math.round((totalScore / testResults.length) * 100) / 100,
      averagePercentage: Math.round((totalPercentage / testResults.length) * 100) / 100,
      totalPossibleScore: totalMaxScore,
      gradeDistribution
    };
  }

  /**
   * Calculate homework performance statistics
   */
  private calculateHomeworkStatistics(submissions: any[]) {
    if (submissions.length === 0) {
      return {
        totalAssignments: 0,
        submitted: 0,
        graded: 0,
        averageScore: 0,
        submissionRate: 0
      };
    }

    const submitted = submissions.filter(s => s.status !== 'not_submitted').length;
    const graded = submissions.filter(s => s.status === 'graded').length;
    const gradedSubmissions = submissions.filter(s => s.score !== null);
    
    let averageScore = 0;
    if (gradedSubmissions.length > 0) {
      const totalScore = gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0);
      averageScore = Math.round((totalScore / gradedSubmissions.length) * 100) / 100;
    }

    return {
      totalAssignments: submissions.length,
      submitted,
      graded,
      averageScore,
      submissionRate: Math.round((submitted / submissions.length) * 100)
    };
  }

  /**
   * Optimized search across multiple entities
   */
  async globalSearch(searchTerm: string, limit: number = 20) {
    const searchPattern = `%${searchTerm}%`;

    return await this.prisma.$transaction(async (tx) => {
      // Search classes
      const classes = await tx.class.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { subject: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        take: Math.ceil(limit / 4),
        select: {
          id: true,
          name: true,
          subject: true,
          description: true,
          room: true
        }
      });

      // Search students
      const students = await tx.student.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { grade: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        take: Math.ceil(limit / 4),
        select: {
          id: true,
          name: true,
          email: true,
          grade: true
        }
      });

      // Search tests
      const tests = await tx.test.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        take: Math.ceil(limit / 4),
        select: {
          id: true,
          title: true,
          description: true,
          testDate: true,
          testType: true,
          class: {
            select: {
              name: true,
              subject: true
            }
          }
        }
      });

      // Search homework
      const homework = await tx.homeworkAssignment.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        take: Math.ceil(limit / 4),
        select: {
          id: true,
          title: true,
          description: true,
          dueDate: true,
          class: {
            select: {
              name: true,
              subject: true
            }
          }
        }
      });

      return {
        classes: classes.map(c => ({ ...c, type: 'class' })),
        students: students.map(s => ({ ...s, type: 'student' })),
        tests: tests.map(t => ({ ...t, type: 'test' })),
        homework: homework.map(h => ({ ...h, type: 'homework' }))
      };
    });
  }
}

export default new QueryOptimizationService();