import { PrismaClient, Test, TestResult, HomeworkAssignment, HomeworkSubmission, Student, TestType, SubmissionStatus } from '@prisma/client';
import { DatabaseError, NotFoundError } from '../utils/errors';

// Use a singleton pattern for Prisma client
let prisma: PrismaClient;

const getPrismaClient = () => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

// Test interfaces
export interface CreateTestData {
  classId: string;
  title: string;
  description: string;
  testDate: string;
  totalPoints: number;
  testType: TestType;
  fileName?: string;
  fileUrl?: string;
}

export interface UpdateTestData {
  title?: string;
  description?: string;
  testDate?: string;
  totalPoints?: number;
  testType?: TestType;
  fileName?: string;
  fileUrl?: string;
}

export interface GetTestsQuery {
  page?: number;
  limit?: number;
  testType?: TestType;
  search?: string;
}

export interface TestWithResults extends Test {
  results: (TestResult & {
    student: Student;
  })[];
  _count: {
    results: number;
  };
}

// Test Result interfaces
export interface CreateTestResultData {
  testId: string;
  studentId: string;
  score: number;
  maxScore: number;
  grade?: string;
  feedback?: string;
  submittedDate?: string;
}

export interface UpdateTestResultData {
  score?: number;
  maxScore?: number;
  grade?: string;
  feedback?: string;
  submittedDate?: string;
}

// Homework Assignment interfaces
export interface CreateHomeworkData {
  classId: string;
  title: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  totalPoints: number;
  instructions?: string;
  resources?: string[];
}

export interface UpdateHomeworkData {
  title?: string;
  description?: string;
  assignedDate?: string;
  dueDate?: string;
  totalPoints?: number;
  instructions?: string;
  resources?: string[];
}

export interface GetHomeworkQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: SubmissionStatus;
}

export interface HomeworkWithSubmissions extends HomeworkAssignment {
  submissions: (HomeworkSubmission & {
    student: Student;
  })[];
  _count: {
    submissions: number;
  };
}

// Homework Submission interfaces
export interface CreateHomeworkSubmissionData {
  assignmentId: string;
  studentId: string;
  submittedDate?: string;
  submissionNotes?: string;
}

export interface UpdateHomeworkSubmissionData {
  submittedDate?: string;
  score?: number;
  grade?: string;
  feedback?: string;
  status?: SubmissionStatus;
  submissionNotes?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export class AssessmentService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || getPrismaClient();
  }

  // Helper method to calculate grade from percentage
  private calculateGrade(percentage: number): string {
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

  // Helper method to calculate percentage
  private calculatePercentage(score: number, maxScore: number): number {
    if (maxScore === 0) return 0;
    return Math.round((score / maxScore) * 100 * 100) / 100; // Round to 2 decimal places
  }

  // TEST METHODS

  /**
   * Get all tests for a class with pagination
   */
  async getTestsByClass(classId: string, query: GetTestsQuery = {}): Promise<PaginatedResponse<TestWithResults>> {
    try {
      // First verify class exists
      const classExists = await this.prisma.class.findUnique({
        where: { id: classId },
      });

      if (!classExists) {
        throw new NotFoundError('Class not found');
      }

      const {
        page = 1,
        limit = 10,
        testType,
        search,
      } = query;

      const currentPage = Math.max(1, page);
      const pageSize = Math.min(Math.max(1, limit), 100);
      const skip = (currentPage - 1) * pageSize;

      // Build where condition
      const whereCondition: any = { classId };

      if (testType) {
        whereCondition.testType = testType;
      }

      if (search) {
        whereCondition.OR = [
          {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ];
      }

      const total = await this.prisma.test.count({
        where: whereCondition,
      });

      const tests = await this.prisma.test.findMany({
        where: whereCondition,
        include: {
          results: {
            include: {
              student: true,
            },
          },
          _count: {
            select: {
              results: true,
            },
          },
        },
        orderBy: {
          testDate: 'desc',
        },
        skip,
        take: pageSize,
      });

      const totalPages = Math.ceil(total / pageSize);

      return {
        data: tests,
        pagination: {
          page: currentPage,
          limit: pageSize,
          total,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch tests', error);
    }
  }

  /**
   * Get a single test by ID with results
   */
  async getTestById(id: string): Promise<TestWithResults> {
    try {
      const test = await this.prisma.test.findUnique({
        where: { id },
        include: {
          results: {
            include: {
              student: true,
            },
          },
          _count: {
            select: {
              results: true,
            },
          },
        },
      });

      if (!test) {
        throw new NotFoundError('Test not found');
      }

      return test;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch test', error);
    }
  }

  /**
   * Create a new test
   */
  async createTest(data: CreateTestData): Promise<Test> {
    try {
      // Verify class exists
      const classExists = await this.prisma.class.findUnique({
        where: { id: data.classId },
      });

      if (!classExists) {
        throw new NotFoundError('Class not found');
      }

      const currentDate = new Date().toISOString().split('T')[0];

      const test = await this.prisma.test.create({
        data: {
          ...data,
          createdDate: currentDate,
          updatedDate: currentDate,
        },
      });

      return test;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to create test', error);
    }
  }

  /**
   * Update a test
   */
  async updateTest(id: string, data: UpdateTestData): Promise<Test> {
    try {
      const existingTest = await this.prisma.test.findUnique({
        where: { id },
      });

      if (!existingTest) {
        throw new NotFoundError('Test not found');
      }

      const currentDate = new Date().toISOString().split('T')[0];

      const updatedTest = await this.prisma.test.update({
        where: { id },
        data: {
          ...data,
          updatedDate: currentDate,
        },
      });

      return updatedTest;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update test', error);
    }
  }

  /**
   * Delete a test
   */
  async deleteTest(id: string): Promise<void> {
    try {
      const existingTest = await this.prisma.test.findUnique({
        where: { id },
      });

      if (!existingTest) {
        throw new NotFoundError('Test not found');
      }

      await this.prisma.test.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete test', error);
    }
  }

  // TEST RESULT METHODS

  /**
   * Get test results for a specific test
   */
  async getTestResults(testId: string): Promise<(TestResult & { student: Student })[]> {
    try {
      const testExists = await this.prisma.test.findUnique({
        where: { id: testId },
      });

      if (!testExists) {
        throw new NotFoundError('Test not found');
      }

      const results = await this.prisma.testResult.findMany({
        where: { testId },
        include: {
          student: true,
        },
        orderBy: {
          student: {
            name: 'asc',
          },
        },
      });

      return results;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch test results', error);
    }
  }

  /**
   * Create or update a test result
   */
  async createOrUpdateTestResult(data: CreateTestResultData): Promise<TestResult> {
    try {
      // Verify test and student exist
      const [test, student] = await Promise.all([
        this.prisma.test.findUnique({ where: { id: data.testId } }),
        this.prisma.student.findUnique({ where: { id: data.studentId } }),
      ]);

      if (!test) {
        throw new NotFoundError('Test not found');
      }

      if (!student) {
        throw new NotFoundError('Student not found');
      }

      // Calculate percentage and grade
      const percentage = this.calculatePercentage(data.score, data.maxScore);
      const grade = data.grade || this.calculateGrade(percentage);
      const currentDate = new Date().toISOString().split('T')[0];

      // Check if result already exists
      const existingResult = await this.prisma.testResult.findUnique({
        where: {
          testId_studentId: {
            testId: data.testId,
            studentId: data.studentId,
          },
        },
      });

      if (existingResult) {
        // Update existing result
        return await this.prisma.testResult.update({
          where: {
            testId_studentId: {
              testId: data.testId,
              studentId: data.studentId,
            },
          },
          data: {
            score: data.score,
            maxScore: data.maxScore,
            percentage,
            grade,
            feedback: data.feedback,
            submittedDate: data.submittedDate,
            gradedDate: currentDate,
            updatedDate: currentDate,
          },
        });
      } else {
        // Create new result
        return await this.prisma.testResult.create({
          data: {
            testId: data.testId,
            studentId: data.studentId,
            score: data.score,
            maxScore: data.maxScore,
            percentage,
            grade,
            feedback: data.feedback,
            submittedDate: data.submittedDate,
            gradedDate: currentDate,
            createdDate: currentDate,
            updatedDate: currentDate,
          },
        });
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to create or update test result', error);
    }
  }

  /**
   * Update a test result
   */
  async updateTestResult(testId: string, studentId: string, data: UpdateTestResultData): Promise<TestResult> {
    try {
      const existingResult = await this.prisma.testResult.findUnique({
        where: {
          testId_studentId: {
            testId,
            studentId,
          },
        },
      });

      if (!existingResult) {
        throw new NotFoundError('Test result not found');
      }

      const currentDate = new Date().toISOString().split('T')[0];
      let updateData: any = {
        ...data,
        updatedDate: currentDate,
      };

      // Recalculate percentage and grade if score or maxScore changed
      if (data.score !== undefined || data.maxScore !== undefined) {
        const score = data.score ?? existingResult.score;
        const maxScore = data.maxScore ?? existingResult.maxScore;
        updateData.percentage = this.calculatePercentage(score, maxScore);
        
        if (!data.grade) {
          updateData.grade = this.calculateGrade(updateData.percentage);
        }
      }

      const updatedResult = await this.prisma.testResult.update({
        where: {
          testId_studentId: {
            testId,
            studentId,
          },
        },
        data: updateData,
      });

      return updatedResult;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update test result', error);
    }
  }

  /**
   * Delete a test result
   */
  async deleteTestResult(testId: string, studentId: string): Promise<void> {
    try {
      const existingResult = await this.prisma.testResult.findUnique({
        where: {
          testId_studentId: {
            testId,
            studentId,
          },
        },
      });

      if (!existingResult) {
        throw new NotFoundError('Test result not found');
      }

      await this.prisma.testResult.delete({
        where: {
          testId_studentId: {
            testId,
            studentId,
          },
        },
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete test result', error);
    }
  }

  // HOMEWORK ASSIGNMENT METHODS

  /**
   * Get all homework assignments for a class with pagination
   */
  async getHomeworkByClass(classId: string, query: GetHomeworkQuery = {}): Promise<PaginatedResponse<HomeworkWithSubmissions>> {
    try {
      // First verify class exists
      const classExists = await this.prisma.class.findUnique({
        where: { id: classId },
      });

      if (!classExists) {
        throw new NotFoundError('Class not found');
      }

      const {
        page = 1,
        limit = 10,
        search,
        status,
      } = query;

      const currentPage = Math.max(1, page);
      const pageSize = Math.min(Math.max(1, limit), 100);
      const skip = (currentPage - 1) * pageSize;

      // Build where condition
      const whereCondition: any = { classId };

      if (search) {
        whereCondition.OR = [
          {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ];
      }

      const total = await this.prisma.homeworkAssignment.count({
        where: whereCondition,
      });

      // Build the query with conditional submission filtering
      const homeworkQuery: any = {
        where: whereCondition,
        include: {
          submissions: {
            include: {
              student: true,
            },
            ...(status && { where: { status } }),
          },
          _count: {
            select: {
              submissions: true,
            },
          },
        },
        orderBy: {
          dueDate: 'desc',
        },
        skip,
        take: pageSize,
      };

      const homework = await this.prisma.homeworkAssignment.findMany(homeworkQuery) as HomeworkWithSubmissions[];

      const totalPages = Math.ceil(total / pageSize);

      return {
        data: homework,
        pagination: {
          page: currentPage,
          limit: pageSize,
          total,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch homework assignments', error);
    }
  }

  /**
   * Get a single homework assignment by ID with submissions
   */
  async getHomeworkById(id: string): Promise<HomeworkWithSubmissions> {
    try {
      const homework = await this.prisma.homeworkAssignment.findUnique({
        where: { id },
        include: {
          submissions: {
            include: {
              student: true,
            },
          },
          _count: {
            select: {
              submissions: true,
            },
          },
        },
      });

      if (!homework) {
        throw new NotFoundError('Homework assignment not found');
      }

      return homework;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch homework assignment', error);
    }
  }

  /**
   * Create a new homework assignment
   */
  async createHomework(data: CreateHomeworkData): Promise<HomeworkAssignment> {
    try {
      // Verify class exists
      const classExists = await this.prisma.class.findUnique({
        where: { id: data.classId },
      });

      if (!classExists) {
        throw new NotFoundError('Class not found');
      }

      const currentDate = new Date().toISOString().split('T')[0];

      const homework = await this.prisma.homeworkAssignment.create({
        data: {
          ...data,
          resources: data.resources || [],
          createdDate: currentDate,
          updatedDate: currentDate,
        },
      });

      return homework;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to create homework assignment', error);
    }
  }

  /**
   * Update a homework assignment
   */
  async updateHomework(id: string, data: UpdateHomeworkData): Promise<HomeworkAssignment> {
    try {
      const existingHomework = await this.prisma.homeworkAssignment.findUnique({
        where: { id },
      });

      if (!existingHomework) {
        throw new NotFoundError('Homework assignment not found');
      }

      const currentDate = new Date().toISOString().split('T')[0];

      const updatedHomework = await this.prisma.homeworkAssignment.update({
        where: { id },
        data: {
          ...data,
          updatedDate: currentDate,
        },
      });

      return updatedHomework;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update homework assignment', error);
    }
  }

  /**
   * Delete a homework assignment
   */
  async deleteHomework(id: string): Promise<void> {
    try {
      const existingHomework = await this.prisma.homeworkAssignment.findUnique({
        where: { id },
      });

      if (!existingHomework) {
        throw new NotFoundError('Homework assignment not found');
      }

      await this.prisma.homeworkAssignment.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete homework assignment', error);
    }
  }

  // HOMEWORK SUBMISSION METHODS

  /**
   * Get homework submissions for a specific assignment
   */
  async getHomeworkSubmissions(assignmentId: string): Promise<(HomeworkSubmission & { student: Student })[]> {
    try {
      const assignmentExists = await this.prisma.homeworkAssignment.findUnique({
        where: { id: assignmentId },
      });

      if (!assignmentExists) {
        throw new NotFoundError('Homework assignment not found');
      }

      const submissions = await this.prisma.homeworkSubmission.findMany({
        where: { assignmentId },
        include: {
          student: true,
        },
        orderBy: {
          student: {
            name: 'asc',
          },
        },
      });

      return submissions;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch homework submissions', error);
    }
  }

  /**
   * Create or update a homework submission
   */
  async createOrUpdateHomeworkSubmission(data: CreateHomeworkSubmissionData): Promise<HomeworkSubmission> {
    try {
      // Verify assignment and student exist
      const [assignment, student] = await Promise.all([
        this.prisma.homeworkAssignment.findUnique({ where: { id: data.assignmentId } }),
        this.prisma.student.findUnique({ where: { id: data.studentId } }),
      ]);

      if (!assignment) {
        throw new NotFoundError('Homework assignment not found');
      }

      if (!student) {
        throw new NotFoundError('Student not found');
      }

      const currentDate = new Date().toISOString().split('T')[0];

      // Check if submission already exists
      const existingSubmission = await this.prisma.homeworkSubmission.findUnique({
        where: {
          assignmentId_studentId: {
            assignmentId: data.assignmentId,
            studentId: data.studentId,
          },
        },
      });

      if (existingSubmission) {
        // Update existing submission
        return await this.prisma.homeworkSubmission.update({
          where: {
            assignmentId_studentId: {
              assignmentId: data.assignmentId,
              studentId: data.studentId,
            },
          },
          data: {
            submittedDate: data.submittedDate || currentDate,
            submissionNotes: data.submissionNotes,
            status: SubmissionStatus.submitted,
            updatedDate: currentDate,
          },
        });
      } else {
        // Create new submission
        return await this.prisma.homeworkSubmission.create({
          data: {
            assignmentId: data.assignmentId,
            studentId: data.studentId,
            submittedDate: data.submittedDate || currentDate,
            submissionNotes: data.submissionNotes,
            maxScore: assignment.totalPoints,
            status: SubmissionStatus.submitted,
            createdDate: currentDate,
            updatedDate: currentDate,
          },
        });
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to create or update homework submission', error);
    }
  }

  /**
   * Update a homework submission (typically for grading)
   */
  async updateHomeworkSubmission(assignmentId: string, studentId: string, data: UpdateHomeworkSubmissionData): Promise<HomeworkSubmission> {
    try {
      const existingSubmission = await this.prisma.homeworkSubmission.findUnique({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId,
          },
        },
      });

      if (!existingSubmission) {
        throw new NotFoundError('Homework submission not found');
      }

      const currentDate = new Date().toISOString().split('T')[0];
      let updateData: any = {
        ...data,
        updatedDate: currentDate,
      };

      // If grading (score provided), update status and graded date
      if (data.score !== undefined) {
        updateData.status = SubmissionStatus.graded;
        updateData.gradedDate = currentDate;
        
        // Calculate grade if not provided
        if (!data.grade && data.score !== undefined) {
          const percentage = this.calculatePercentage(data.score, existingSubmission.maxScore);
          updateData.grade = this.calculateGrade(percentage);
        }
      }

      const updatedSubmission = await this.prisma.homeworkSubmission.update({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId,
          },
        },
        data: updateData,
      });

      return updatedSubmission;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update homework submission', error);
    }
  }

  /**
   * Delete a homework submission
   */
  async deleteHomeworkSubmission(assignmentId: string, studentId: string): Promise<void> {
    try {
      const existingSubmission = await this.prisma.homeworkSubmission.findUnique({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId,
          },
        },
      });

      if (!existingSubmission) {
        throw new NotFoundError('Homework submission not found');
      }

      await this.prisma.homeworkSubmission.delete({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId,
          },
        },
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete homework submission', error);
    }
  }

  /**
   * Get student's submissions for a specific class
   */
  async getStudentSubmissions(classId: string, studentId: string): Promise<{
    testResults: (TestResult & { test: Test })[];
    homeworkSubmissions: (HomeworkSubmission & { assignment: HomeworkAssignment })[];
  }> {
    try {
      // Verify class and student exist
      const [classExists, studentExists] = await Promise.all([
        this.prisma.class.findUnique({ where: { id: classId } }),
        this.prisma.student.findUnique({ where: { id: studentId } }),
      ]);

      if (!classExists) {
        throw new NotFoundError('Class not found');
      }

      if (!studentExists) {
        throw new NotFoundError('Student not found');
      }

      // Get test results for the student in this class
      const testResults = await this.prisma.testResult.findMany({
        where: {
          studentId,
          test: {
            classId,
          },
        },
        include: {
          test: true,
        },
        orderBy: {
          test: {
            testDate: 'desc',
          },
        },
      });

      // Get homework submissions for the student in this class
      const homeworkSubmissions = await this.prisma.homeworkSubmission.findMany({
        where: {
          studentId,
          assignment: {
            classId,
          },
        },
        include: {
          assignment: true,
        },
        orderBy: {
          assignment: {
            dueDate: 'desc',
          },
        },
      });

      return {
        testResults,
        homeworkSubmissions,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch student submissions', error);
    }
  }
}

export default new AssessmentService();