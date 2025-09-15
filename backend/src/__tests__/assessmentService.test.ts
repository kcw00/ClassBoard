import { AssessmentService } from '../services/assessmentService';
import { PrismaClient, TestType, SubmissionStatus } from '@prisma/client';
import { DatabaseError, NotFoundError, ConflictError } from '../utils/errors';

// Mock Prisma Client
const mockPrismaClient = {
  class: {
    findUnique: jest.fn(),
  },
  student: {
    findUnique: jest.fn(),
  },
  test: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  testResult: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  homeworkAssignment: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  homeworkSubmission: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
} as unknown as PrismaClient;

describe('AssessmentService', () => {
  let assessmentService: AssessmentService;

  beforeEach(() => {
    assessmentService = new AssessmentService(mockPrismaClient);
    jest.clearAllMocks();
  });

  describe('Test Management', () => {
    describe('getTestsByClass', () => {
      it('should return paginated tests for a class', async () => {
        const classId = 'class-1';
        const mockClass = { id: classId, name: 'Math 101' };
        const mockTests = [
          {
            id: 'test-1',
            title: 'Quiz 1',
            classId,
            results: [],
            _count: { results: 0 },
          },
        ];

        (mockPrismaClient.class.findUnique as jest.Mock).mockResolvedValue(mockClass);
        (mockPrismaClient.test.count as jest.Mock).mockResolvedValue(1);
        (mockPrismaClient.test.findMany as jest.Mock).mockResolvedValue(mockTests);

        const result = await assessmentService.getTestsByClass(classId);

        expect(result.data).toEqual(mockTests);
        expect(result.pagination.total).toBe(1);
        expect(mockPrismaClient.class.findUnique).toHaveBeenCalledWith({
          where: { id: classId },
        });
      });

      it('should throw NotFoundError if class does not exist', async () => {
        const classId = 'nonexistent-class';
        (mockPrismaClient.class.findUnique as jest.Mock).mockResolvedValue(null);

        await expect(assessmentService.getTestsByClass(classId)).rejects.toThrow(NotFoundError);
      });

      it('should filter tests by type and search term', async () => {
        const classId = 'class-1';
        const mockClass = { id: classId, name: 'Math 101' };
        
        (mockPrismaClient.class.findUnique as jest.Mock).mockResolvedValue(mockClass);
        (mockPrismaClient.test.count as jest.Mock).mockResolvedValue(0);
        (mockPrismaClient.test.findMany as jest.Mock).mockResolvedValue([]);

        await assessmentService.getTestsByClass(classId, {
          testType: TestType.quiz,
          search: 'algebra',
        });

        expect(mockPrismaClient.test.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              classId,
              testType: TestType.quiz,
              OR: expect.arrayContaining([
                { title: { contains: 'algebra', mode: 'insensitive' } },
                { description: { contains: 'algebra', mode: 'insensitive' } },
              ]),
            }),
          })
        );
      });
    });

    describe('createTest', () => {
      it('should create a new test', async () => {
        const classId = 'class-1';
        const testData = {
          classId,
          title: 'Midterm Exam',
          description: 'Comprehensive midterm examination',
          testDate: '2024-03-15',
          totalPoints: 100,
          testType: TestType.exam,
        };
        const mockClass = { id: classId, name: 'Math 101' };
        const mockTest = { id: 'test-1', ...testData };

        (mockPrismaClient.class.findUnique as jest.Mock).mockResolvedValue(mockClass);
        (mockPrismaClient.test.create as jest.Mock).mockResolvedValue(mockTest);

        const result = await assessmentService.createTest(testData);

        expect(result).toEqual(mockTest);
        expect(mockPrismaClient.test.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            ...testData,
            createdDate: expect.any(String),
            updatedDate: expect.any(String),
          }),
        });
      });

      it('should throw NotFoundError if class does not exist', async () => {
        const testData = {
          classId: 'nonexistent-class',
          title: 'Test',
          description: 'Description',
          testDate: '2024-03-15',
          totalPoints: 100,
          testType: TestType.quiz,
        };

        (mockPrismaClient.class.findUnique as jest.Mock).mockResolvedValue(null);

        await expect(assessmentService.createTest(testData)).rejects.toThrow(NotFoundError);
      });
    });

    describe('updateTest', () => {
      it('should update an existing test', async () => {
        const testId = 'test-1';
        const updates = { title: 'Updated Test Title' };
        const mockExistingTest = { id: testId, title: 'Original Title' };
        const mockUpdatedTest = { ...mockExistingTest, ...updates };

        (mockPrismaClient.test.findUnique as jest.Mock).mockResolvedValue(mockExistingTest);
        (mockPrismaClient.test.update as jest.Mock).mockResolvedValue(mockUpdatedTest);

        const result = await assessmentService.updateTest(testId, updates);

        expect(result).toEqual(mockUpdatedTest);
        expect(mockPrismaClient.test.update).toHaveBeenCalledWith({
          where: { id: testId },
          data: expect.objectContaining({
            ...updates,
            updatedDate: expect.any(String),
          }),
        });
      });

      it('should throw NotFoundError if test does not exist', async () => {
        const testId = 'nonexistent-test';
        const updates = { title: 'Updated Title' };

        (mockPrismaClient.test.findUnique as jest.Mock).mockResolvedValue(null);

        await expect(assessmentService.updateTest(testId, updates)).rejects.toThrow(NotFoundError);
      });
    });

    describe('deleteTest', () => {
      it('should delete an existing test', async () => {
        const testId = 'test-1';
        const mockTest = { id: testId, title: 'Test to Delete' };

        (mockPrismaClient.test.findUnique as jest.Mock).mockResolvedValue(mockTest);
        (mockPrismaClient.test.delete as jest.Mock).mockResolvedValue(mockTest);

        await assessmentService.deleteTest(testId);

        expect(mockPrismaClient.test.delete).toHaveBeenCalledWith({
          where: { id: testId },
        });
      });

      it('should throw NotFoundError if test does not exist', async () => {
        const testId = 'nonexistent-test';

        (mockPrismaClient.test.findUnique as jest.Mock).mockResolvedValue(null);

        await expect(assessmentService.deleteTest(testId)).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('Test Results Management', () => {
    describe('createOrUpdateTestResult', () => {
      it('should create a new test result', async () => {
        const resultData = {
          testId: 'test-1',
          studentId: 'student-1',
          score: 85,
          maxScore: 100,
        };
        const mockTest = { id: 'test-1', title: 'Test' };
        const mockStudent = { id: 'student-1', name: 'John Doe' };
        const mockResult = {
          id: 'result-1',
          ...resultData,
          percentage: 85,
          grade: 'B',
        };

        (mockPrismaClient.test.findUnique as jest.Mock).mockResolvedValue(mockTest);
        (mockPrismaClient.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);
        (mockPrismaClient.testResult.findUnique as jest.Mock).mockResolvedValue(null);
        (mockPrismaClient.testResult.create as jest.Mock).mockResolvedValue(mockResult);

        const result = await assessmentService.createOrUpdateTestResult(resultData);

        expect(result).toEqual(mockResult);
        expect(mockPrismaClient.testResult.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            ...resultData,
            percentage: 85,
            grade: 'B',
            gradedDate: expect.any(String),
            createdDate: expect.any(String),
            updatedDate: expect.any(String),
          }),
        });
      });

      it('should update an existing test result', async () => {
        const resultData = {
          testId: 'test-1',
          studentId: 'student-1',
          score: 90,
          maxScore: 100,
        };
        const mockTest = { id: 'test-1', title: 'Test' };
        const mockStudent = { id: 'student-1', name: 'John Doe' };
        const mockExistingResult = {
          id: 'result-1',
          testId: 'test-1',
          studentId: 'student-1',
          score: 85,
          maxScore: 100,
        };
        const mockUpdatedResult = {
          ...mockExistingResult,
          score: 90,
          percentage: 90,
          grade: 'A-',
        };

        (mockPrismaClient.test.findUnique as jest.Mock).mockResolvedValue(mockTest);
        (mockPrismaClient.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);
        (mockPrismaClient.testResult.findUnique as jest.Mock).mockResolvedValue(mockExistingResult);
        (mockPrismaClient.testResult.update as jest.Mock).mockResolvedValue(mockUpdatedResult);

        const result = await assessmentService.createOrUpdateTestResult(resultData);

        expect(result).toEqual(mockUpdatedResult);
        expect(mockPrismaClient.testResult.update).toHaveBeenCalled();
      });

      it('should calculate correct grade from percentage', async () => {
        const resultData = {
          testId: 'test-1',
          studentId: 'student-1',
          score: 97,
          maxScore: 100,
        };
        const mockTest = { id: 'test-1', title: 'Test' };
        const mockStudent = { id: 'student-1', name: 'John Doe' };

        (mockPrismaClient.test.findUnique as jest.Mock).mockResolvedValue(mockTest);
        (mockPrismaClient.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);
        (mockPrismaClient.testResult.findUnique as jest.Mock).mockResolvedValue(null);
        (mockPrismaClient.testResult.create as jest.Mock).mockResolvedValue({});

        await assessmentService.createOrUpdateTestResult(resultData);

        expect(mockPrismaClient.testResult.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            percentage: 97,
            grade: 'A+',
          }),
        });
      });
    });
  });

  describe('Homework Management', () => {
    describe('createHomework', () => {
      it('should create a new homework assignment', async () => {
        const homeworkData = {
          classId: 'class-1',
          title: 'Chapter 5 Problems',
          description: 'Complete problems 1-20',
          assignedDate: '2024-03-01',
          dueDate: '2024-03-08',
          totalPoints: 50,
        };
        const mockClass = { id: 'class-1', name: 'Math 101' };
        const mockHomework = { id: 'homework-1', ...homeworkData };

        (mockPrismaClient.class.findUnique as jest.Mock).mockResolvedValue(mockClass);
        (mockPrismaClient.homeworkAssignment.create as jest.Mock).mockResolvedValue(mockHomework);

        const result = await assessmentService.createHomework(homeworkData);

        expect(result).toEqual(mockHomework);
        expect(mockPrismaClient.homeworkAssignment.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            ...homeworkData,
            resources: [],
            createdDate: expect.any(String),
            updatedDate: expect.any(String),
          }),
        });
      });

      it('should throw NotFoundError if class does not exist', async () => {
        const homeworkData = {
          classId: 'nonexistent-class',
          title: 'Homework',
          description: 'Description',
          assignedDate: '2024-03-01',
          dueDate: '2024-03-08',
          totalPoints: 50,
        };

        (mockPrismaClient.class.findUnique as jest.Mock).mockResolvedValue(null);

        await expect(assessmentService.createHomework(homeworkData)).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('Homework Submissions Management', () => {
    describe('createOrUpdateHomeworkSubmission', () => {
      it('should create a new homework submission', async () => {
        const submissionData = {
          assignmentId: 'homework-1',
          studentId: 'student-1',
          submissionNotes: 'Completed all problems',
        };
        const mockAssignment = { id: 'homework-1', totalPoints: 50 };
        const mockStudent = { id: 'student-1', name: 'John Doe' };
        const mockSubmission = {
          id: 'submission-1',
          ...submissionData,
          status: SubmissionStatus.submitted,
        };

        (mockPrismaClient.homeworkAssignment.findUnique as jest.Mock).mockResolvedValue(mockAssignment);
        (mockPrismaClient.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);
        (mockPrismaClient.homeworkSubmission.findUnique as jest.Mock).mockResolvedValue(null);
        (mockPrismaClient.homeworkSubmission.create as jest.Mock).mockResolvedValue(mockSubmission);

        const result = await assessmentService.createOrUpdateHomeworkSubmission(submissionData);

        expect(result).toEqual(mockSubmission);
        expect(mockPrismaClient.homeworkSubmission.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            ...submissionData,
            maxScore: 50,
            status: SubmissionStatus.submitted,
            submittedDate: expect.any(String),
            createdDate: expect.any(String),
            updatedDate: expect.any(String),
          }),
        });
      });

      it('should update an existing homework submission', async () => {
        const submissionData = {
          assignmentId: 'homework-1',
          studentId: 'student-1',
          submissionNotes: 'Updated submission',
        };
        const mockAssignment = { id: 'homework-1', totalPoints: 50 };
        const mockStudent = { id: 'student-1', name: 'John Doe' };
        const mockExistingSubmission = {
          id: 'submission-1',
          assignmentId: 'homework-1',
          studentId: 'student-1',
        };
        const mockUpdatedSubmission = {
          ...mockExistingSubmission,
          submissionNotes: 'Updated submission',
        };

        (mockPrismaClient.homeworkAssignment.findUnique as jest.Mock).mockResolvedValue(mockAssignment);
        (mockPrismaClient.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);
        (mockPrismaClient.homeworkSubmission.findUnique as jest.Mock).mockResolvedValue(mockExistingSubmission);
        (mockPrismaClient.homeworkSubmission.update as jest.Mock).mockResolvedValue(mockUpdatedSubmission);

        const result = await assessmentService.createOrUpdateHomeworkSubmission(submissionData);

        expect(result).toEqual(mockUpdatedSubmission);
        expect(mockPrismaClient.homeworkSubmission.update).toHaveBeenCalled();
      });
    });

    describe('updateHomeworkSubmission', () => {
      it('should update homework submission with grading information', async () => {
        const assignmentId = 'homework-1';
        const studentId = 'student-1';
        const updates = {
          score: 45,
          feedback: 'Good work!',
        };
        const mockExistingSubmission = {
          id: 'submission-1',
          assignmentId,
          studentId,
          maxScore: 50,
        };
        const mockUpdatedSubmission = {
          ...mockExistingSubmission,
          ...updates,
          status: SubmissionStatus.graded,
          grade: 'A-',
        };

        (mockPrismaClient.homeworkSubmission.findUnique as jest.Mock).mockResolvedValue(mockExistingSubmission);
        (mockPrismaClient.homeworkSubmission.update as jest.Mock).mockResolvedValue(mockUpdatedSubmission);

        const result = await assessmentService.updateHomeworkSubmission(assignmentId, studentId, updates);

        expect(result).toEqual(mockUpdatedSubmission);
        expect(mockPrismaClient.homeworkSubmission.update).toHaveBeenCalledWith({
          where: {
            assignmentId_studentId: {
              assignmentId,
              studentId,
            },
          },
          data: expect.objectContaining({
            ...updates,
            status: SubmissionStatus.graded,
            grade: 'A-',
            gradedDate: expect.any(String),
            updatedDate: expect.any(String),
          }),
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw DatabaseError when Prisma operations fail', async () => {
      const classId = 'class-1';
      (mockPrismaClient.class.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      await expect(assessmentService.getTestsByClass(classId)).rejects.toThrow(DatabaseError);
    });
  });
});