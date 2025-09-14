import request from 'supertest';
import app from '../../app';
import { PrismaClient, TestType, SubmissionStatus } from '@prisma/client';
import jwt from 'jsonwebtoken';
import config from '../../config';

const prisma = new PrismaClient();

// Test user for authentication
const testUser = {
  id: 'test-user-1',
  email: 'teacher@test.com',
  name: 'Test Teacher',
  role: 'TEACHER' as const,
};

// Generate test JWT token
const generateTestToken = () => {
  return jwt.sign(
    {
      userId: testUser.id,
      email: testUser.email,
      role: testUser.role,
    },
    config.jwt.secret,
    { expiresIn: '1h' }
  );
};

describe('Assessment Integration Tests', () => {
  let authToken: string;
  let testClass: any;
  let testStudent: any;
  let testTest: any;
  let testHomework: any;

  beforeAll(async () => {
    authToken = generateTestToken();

    // Create test user
    await prisma.user.upsert({
      where: { email: testUser.email },
      update: testUser,
      create: testUser,
    });

    // Create test class
    testClass = await prisma.class.create({
      data: {
        name: 'Test Assessment Class',
        subject: 'Mathematics',
        description: 'Test class for assessment integration tests',
        room: 'Room 101',
        capacity: 30,
        color: '#FF5733',
        createdDate: '2024-01-01',
      },
    });

    // Create test student
    testStudent = await prisma.student.create({
      data: {
        name: 'Test Student',
        email: 'student@test.com',
        phone: '123-456-7890',
        grade: '10th',
        parentContact: 'parent@test.com',
        enrollmentDate: '2024-01-01',
      },
    });

    // Enroll student in class
    await prisma.classEnrollment.create({
      data: {
        classId: testClass.id,
        studentId: testStudent.id,
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.testResult.deleteMany({});
    await prisma.test.deleteMany({});
    await prisma.homeworkSubmission.deleteMany({});
    await prisma.homeworkAssignment.deleteMany({});
    await prisma.classEnrollment.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.class.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up assessment data before each test
    await prisma.testResult.deleteMany({});
    await prisma.test.deleteMany({});
    await prisma.homeworkSubmission.deleteMany({});
    await prisma.homeworkAssignment.deleteMany({});
  });

  describe('Test Management', () => {
    describe('POST /api/tests', () => {
      it('should create a new test', async () => {
        const testData = {
          classId: testClass.id,
          title: 'Algebra Quiz',
          description: 'Quiz on basic algebra concepts',
          testDate: '2024-03-15',
          totalPoints: 100,
          testType: TestType.quiz,
        };

        const response = await request(app)
          .post('/api/tests')
          .set('Authorization', `Bearer ${authToken}`)
          .send(testData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          title: testData.title,
          description: testData.description,
          testDate: testData.testDate,
          totalPoints: testData.totalPoints,
          testType: testData.testType,
        });

        testTest = response.body.data;
      });

      it('should return 400 for invalid test data', async () => {
        const invalidTestData = {
          classId: testClass.id,
          title: '', // Invalid: empty title
          description: 'Description',
          testDate: 'invalid-date', // Invalid: wrong date format
          totalPoints: -10, // Invalid: negative points
          testType: 'invalid-type', // Invalid: not a valid TestType
        };

        const response = await request(app)
          .post('/api/tests')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidTestData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 404 for non-existent class', async () => {
        const testData = {
          classId: 'non-existent-class-id',
          title: 'Test',
          description: 'Description',
          testDate: '2024-03-15',
          totalPoints: 100,
          testType: TestType.quiz,
        };

        const response = await request(app)
          .post('/api/tests')
          .set('Authorization', `Bearer ${authToken}`)
          .send(testData)
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/classes/:classId/tests', () => {
      beforeEach(async () => {
        // Create test data
        testTest = await prisma.test.create({
          data: {
            classId: testClass.id,
            title: 'Sample Test',
            description: 'Sample test description',
            testDate: '2024-03-15',
            totalPoints: 100,
            testType: TestType.exam,
            createdDate: '2024-01-01',
            updatedDate: '2024-01-01',
          },
        });
      });

      it('should get all tests for a class', async () => {
        const response = await request(app)
          .get(`/api/classes/${testClass.id}/tests`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0]).toMatchObject({
          title: 'Sample Test',
          testType: TestType.exam,
        });
        expect(response.body.pagination).toBeDefined();
      });

      it('should filter tests by type', async () => {
        // Create another test with different type
        await prisma.test.create({
          data: {
            classId: testClass.id,
            title: 'Quiz Test',
            description: 'Quiz description',
            testDate: '2024-03-20',
            totalPoints: 50,
            testType: TestType.quiz,
            createdDate: '2024-01-01',
            updatedDate: '2024-01-01',
          },
        });

        const response = await request(app)
          .get(`/api/classes/${testClass.id}/tests?testType=quiz`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].testType).toBe(TestType.quiz);
      });

      it('should search tests by title', async () => {
        const response = await request(app)
          .get(`/api/classes/${testClass.id}/tests?search=Sample`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].title).toContain('Sample');
      });
    });

    describe('PUT /api/tests/:id', () => {
      beforeEach(async () => {
        testTest = await prisma.test.create({
          data: {
            classId: testClass.id,
            title: 'Original Test',
            description: 'Original description',
            testDate: '2024-03-15',
            totalPoints: 100,
            testType: TestType.exam,
            createdDate: '2024-01-01',
            updatedDate: '2024-01-01',
          },
        });
      });

      it('should update a test', async () => {
        const updates = {
          title: 'Updated Test Title',
          totalPoints: 150,
        };

        const response = await request(app)
          .put(`/api/tests/${testTest.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updates)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(updates.title);
        expect(response.body.data.totalPoints).toBe(updates.totalPoints);
      });

      it('should return 404 for non-existent test', async () => {
        const updates = { title: 'Updated Title' };

        const response = await request(app)
          .put('/api/tests/non-existent-test-id')
          .set('Authorization', `Bearer ${authToken}`)
          .send(updates)
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });

    describe('DELETE /api/tests/:id', () => {
      beforeEach(async () => {
        testTest = await prisma.test.create({
          data: {
            classId: testClass.id,
            title: 'Test to Delete',
            description: 'Description',
            testDate: '2024-03-15',
            totalPoints: 100,
            testType: TestType.quiz,
            createdDate: '2024-01-01',
            updatedDate: '2024-01-01',
          },
        });
      });

      it('should delete a test', async () => {
        const response = await request(app)
          .delete(`/api/tests/${testTest.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');

        // Verify test is deleted
        const deletedTest = await prisma.test.findUnique({
          where: { id: testTest.id },
        });
        expect(deletedTest).toBeNull();
      });
    });
  });

  describe('Test Results Management', () => {
    beforeEach(async () => {
      testTest = await prisma.test.create({
        data: {
          classId: testClass.id,
          title: 'Test for Results',
          description: 'Description',
          testDate: '2024-03-15',
          totalPoints: 100,
          testType: TestType.exam,
          createdDate: '2024-01-01',
          updatedDate: '2024-01-01',
        },
      });
    });

    describe('POST /api/test-results', () => {
      it('should create a test result', async () => {
        const resultData = {
          testId: testTest.id,
          studentId: testStudent.id,
          score: 85,
          maxScore: 100,
          feedback: 'Good work!',
        };

        const response = await request(app)
          .post('/api/test-results')
          .set('Authorization', `Bearer ${authToken}`)
          .send(resultData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          score: 85,
          maxScore: 100,
          percentage: 85,
          grade: 'B',
          feedback: 'Good work!',
        });
      });

      it('should update existing test result', async () => {
        // Create initial result
        await prisma.testResult.create({
          data: {
            testId: testTest.id,
            studentId: testStudent.id,
            score: 75,
            maxScore: 100,
            percentage: 75,
            grade: 'C',
            gradedDate: '2024-01-01',
            createdDate: '2024-01-01',
            updatedDate: '2024-01-01',
          },
        });

        const updatedResultData = {
          testId: testTest.id,
          studentId: testStudent.id,
          score: 90,
          maxScore: 100,
          feedback: 'Improved performance!',
        };

        const response = await request(app)
          .post('/api/test-results')
          .set('Authorization', `Bearer ${authToken}`)
          .send(updatedResultData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.score).toBe(90);
        expect(response.body.data.percentage).toBe(90);
        expect(response.body.data.grade).toBe('A-');
      });
    });

    describe('GET /api/tests/:testId/results', () => {
      beforeEach(async () => {
        await prisma.testResult.create({
          data: {
            testId: testTest.id,
            studentId: testStudent.id,
            score: 88,
            maxScore: 100,
            percentage: 88,
            grade: 'B+',
            gradedDate: '2024-01-01',
            createdDate: '2024-01-01',
            updatedDate: '2024-01-01',
          },
        });
      });

      it('should get all results for a test', async () => {
        const response = await request(app)
          .get(`/api/tests/${testTest.id}/results`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0]).toMatchObject({
          score: 88,
          percentage: 88,
          grade: 'B+',
        });
        expect(response.body.data[0].student).toBeDefined();
      });
    });
  });

  describe('Homework Management', () => {
    describe('POST /api/homework', () => {
      it('should create a new homework assignment', async () => {
        const homeworkData = {
          classId: testClass.id,
          title: 'Chapter 5 Problems',
          description: 'Complete problems 1-20 from chapter 5',
          assignedDate: '2024-03-01',
          dueDate: '2024-03-08',
          totalPoints: 50,
          instructions: 'Show all work clearly',
          resources: ['Textbook Chapter 5', 'Online calculator'],
        };

        const response = await request(app)
          .post('/api/homework')
          .set('Authorization', `Bearer ${authToken}`)
          .send(homeworkData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          title: homeworkData.title,
          description: homeworkData.description,
          assignedDate: homeworkData.assignedDate,
          dueDate: homeworkData.dueDate,
          totalPoints: homeworkData.totalPoints,
          instructions: homeworkData.instructions,
          resources: homeworkData.resources,
        });

        testHomework = response.body.data;
      });

      it('should return 400 for invalid homework data', async () => {
        const invalidHomeworkData = {
          classId: testClass.id,
          title: '', // Invalid: empty title
          description: 'Description',
          assignedDate: 'invalid-date', // Invalid: wrong date format
          dueDate: '2024-03-08',
          totalPoints: 0, // Invalid: zero points
        };

        const response = await request(app)
          .post('/api/homework')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidHomeworkData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('GET /api/classes/:classId/homework', () => {
      beforeEach(async () => {
        testHomework = await prisma.homeworkAssignment.create({
          data: {
            classId: testClass.id,
            title: 'Sample Homework',
            description: 'Sample homework description',
            assignedDate: '2024-03-01',
            dueDate: '2024-03-08',
            totalPoints: 50,
            createdDate: '2024-01-01',
            updatedDate: '2024-01-01',
          },
        });
      });

      it('should get all homework assignments for a class', async () => {
        const response = await request(app)
          .get(`/api/classes/${testClass.id}/homework`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0]).toMatchObject({
          title: 'Sample Homework',
          totalPoints: 50,
        });
        expect(response.body.pagination).toBeDefined();
      });

      it('should search homework by title', async () => {
        const response = await request(app)
          .get(`/api/classes/${testClass.id}/homework?search=Sample`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].title).toContain('Sample');
      });
    });
  });

  describe('Homework Submissions Management', () => {
    beforeEach(async () => {
      testHomework = await prisma.homeworkAssignment.create({
        data: {
          classId: testClass.id,
          title: 'Homework for Submissions',
          description: 'Description',
          assignedDate: '2024-03-01',
          dueDate: '2024-03-08',
          totalPoints: 50,
          createdDate: '2024-01-01',
          updatedDate: '2024-01-01',
        },
      });
    });

    describe('POST /api/homework-submissions', () => {
      it('should create a homework submission', async () => {
        const submissionData = {
          assignmentId: testHomework.id,
          studentId: testStudent.id,
          submissionNotes: 'Completed all problems as requested',
        };

        const response = await request(app)
          .post('/api/homework-submissions')
          .set('Authorization', `Bearer ${authToken}`)
          .send(submissionData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          assignmentId: testHomework.id,
          studentId: testStudent.id,
          submissionNotes: 'Completed all problems as requested',
          status: SubmissionStatus.submitted,
          maxScore: 50,
        });
      });
    });

    describe('PUT /api/homework/:assignmentId/submissions/:studentId', () => {
      beforeEach(async () => {
        await prisma.homeworkSubmission.create({
          data: {
            assignmentId: testHomework.id,
            studentId: testStudent.id,
            maxScore: 50,
            status: SubmissionStatus.submitted,
            submittedDate: '2024-03-07',
            createdDate: '2024-01-01',
            updatedDate: '2024-01-01',
          },
        });
      });

      it('should grade a homework submission', async () => {
        const gradingData = {
          score: 45,
          feedback: 'Excellent work! Minor calculation error in problem 15.',
        };

        const response = await request(app)
          .put(`/api/homework/${testHomework.id}/submissions/${testStudent.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(gradingData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          score: 45,
          feedback: 'Excellent work! Minor calculation error in problem 15.',
          status: SubmissionStatus.graded,
          grade: 'A-', // 45/50 = 90%
        });
        expect(response.body.data.gradedDate).toBeDefined();
      });
    });

    describe('GET /api/homework/:assignmentId/submissions', () => {
      beforeEach(async () => {
        await prisma.homeworkSubmission.create({
          data: {
            assignmentId: testHomework.id,
            studentId: testStudent.id,
            maxScore: 50,
            score: 42,
            grade: 'B+',
            status: SubmissionStatus.graded,
            submittedDate: '2024-03-07',
            gradedDate: '2024-03-10',
            createdDate: '2024-01-01',
            updatedDate: '2024-01-01',
          },
        });
      });

      it('should get all submissions for a homework assignment', async () => {
        const response = await request(app)
          .get(`/api/homework/${testHomework.id}/submissions`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0]).toMatchObject({
          score: 42,
          grade: 'B+',
          status: SubmissionStatus.graded,
        });
        expect(response.body.data[0].student).toBeDefined();
      });
    });
  });

  describe('Student Assessment Overview', () => {
    beforeEach(async () => {
      // Create test data
      testTest = await prisma.test.create({
        data: {
          classId: testClass.id,
          title: 'Overview Test',
          description: 'Description',
          testDate: '2024-03-15',
          totalPoints: 100,
          testType: TestType.exam,
          createdDate: '2024-01-01',
          updatedDate: '2024-01-01',
        },
      });

      testHomework = await prisma.homeworkAssignment.create({
        data: {
          classId: testClass.id,
          title: 'Overview Homework',
          description: 'Description',
          assignedDate: '2024-03-01',
          dueDate: '2024-03-08',
          totalPoints: 50,
          createdDate: '2024-01-01',
          updatedDate: '2024-01-01',
        },
      });

      // Create test result and homework submission
      await prisma.testResult.create({
        data: {
          testId: testTest.id,
          studentId: testStudent.id,
          score: 92,
          maxScore: 100,
          percentage: 92,
          grade: 'A-',
          gradedDate: '2024-03-16',
          createdDate: '2024-01-01',
          updatedDate: '2024-01-01',
        },
      });

      await prisma.homeworkSubmission.create({
        data: {
          assignmentId: testHomework.id,
          studentId: testStudent.id,
          score: 48,
          maxScore: 50,
          grade: 'A',
          status: SubmissionStatus.graded,
          submittedDate: '2024-03-07',
          gradedDate: '2024-03-10',
          createdDate: '2024-01-01',
          updatedDate: '2024-01-01',
        },
      });
    });

    describe('GET /api/classes/:classId/students/:studentId/assessments', () => {
      it('should get all assessments for a student in a class', async () => {
        const response = await request(app)
          .get(`/api/classes/${testClass.id}/students/${testStudent.id}/assessments`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.testResults).toHaveLength(1);
        expect(response.body.data.homeworkSubmissions).toHaveLength(1);
        
        expect(response.body.data.testResults[0]).toMatchObject({
          score: 92,
          grade: 'A-',
        });
        expect(response.body.data.testResults[0].test).toBeDefined();
        
        expect(response.body.data.homeworkSubmissions[0]).toMatchObject({
          score: 48,
          grade: 'A',
        });
        expect(response.body.data.homeworkSubmissions[0].assignment).toBeDefined();
      });
    });
  });

  describe('Authentication', () => {
    it('should return 401 for requests without authentication token', async () => {
      const response = await request(app)
        .get(`/api/classes/${testClass.id}/tests`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 for requests with invalid authentication token', async () => {
      const response = await request(app)
        .get(`/api/classes/${testClass.id}/tests`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});