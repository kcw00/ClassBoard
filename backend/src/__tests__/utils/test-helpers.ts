import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import app from '../../app';
import { generateTestToken } from '../setup';

export interface TestContext {
  authToken: string;
  userId: string;
  prisma?: PrismaClient;
}

export interface TestDataCleanup {
  classIds: string[];
  studentIds: string[];
  testIds: string[];
  meetingIds: string[];
  fileIds: string[];
}

/**
 * Creates a test context with authentication and database access
 */
export const createTestContext = (userId = 'test-user', email = 'test@example.com', role = 'teacher'): TestContext => {
  return {
    authToken: generateTestToken(userId, email, role),
    userId,
    prisma: new PrismaClient(),
  };
};

/**
 * Creates test data and returns cleanup information
 */
export const createTestData = async (context: TestContext): Promise<TestDataCleanup> => {
  const cleanup: TestDataCleanup = {
    classIds: [],
    studentIds: [],
    testIds: [],
    meetingIds: [],
    fileIds: [],
  };

  // Create test classes
  for (let i = 0; i < 3; i++) {
    const response = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${context.authToken}`)
      .send({
        name: `Test Class ${i + 1}`,
        subject: `Subject ${i + 1}`,
        description: `Test class description ${i + 1}`,
        room: `Room ${i + 1}`,
        capacity: 30,
        color: '#3B82F6',
      });

    if (response.status === 201) {
      cleanup.classIds.push(response.body.data.id);
    }
  }

  // Create test students
  for (let i = 0; i < 5; i++) {
    const response = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${context.authToken}`)
      .send({
        name: `Test Student ${i + 1}`,
        email: `test.student${i + 1}@example.com`,
        phone: `555-000${i}`,
        grade: '10th',
        parentContact: `parent${i + 1}@example.com`,
      });

    if (response.status === 201) {
      cleanup.studentIds.push(response.body.data.id);
    }
  }

  return cleanup;
};

/**
 * Cleans up test data
 */
export const cleanupTestData = async (context: TestContext, cleanup: TestDataCleanup): Promise<void> => {
  // Delete in reverse order of dependencies

  // Delete test results first (they depend on tests and students)
  for (const testId of cleanup.testIds) {
    try {
      await request(app)
        .delete(`/api/tests/${testId}`)
        .set('Authorization', `Bearer ${context.authToken}`);
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  // Delete meetings
  for (const meetingId of cleanup.meetingIds) {
    try {
      await request(app)
        .delete(`/api/meetings/${meetingId}`)
        .set('Authorization', `Bearer ${context.authToken}`);
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  // Delete files
  for (const fileId of cleanup.fileIds) {
    try {
      await request(app)
        .delete(`/api/files/${fileId}`)
        .set('Authorization', `Bearer ${context.authToken}`);
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  // Delete students
  for (const studentId of cleanup.studentIds) {
    try {
      await request(app)
        .delete(`/api/students/${studentId}`)
        .set('Authorization', `Bearer ${context.authToken}`);
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  // Delete classes last
  for (const classId of cleanup.classIds) {
    try {
      await request(app)
        .delete(`/api/classes/${classId}`)
        .set('Authorization', `Bearer ${context.authToken}`);
    } catch (error) {
      // Ignore cleanup errors
    }
  }
};

/**
 * Enrolls students in classes for testing
 */
export const enrollStudentsInClasses = async (
  context: TestContext,
  classIds: string[],
  studentIds: string[]
): Promise<void> => {
  for (const classId of classIds) {
    for (const studentId of studentIds) {
      try {
        await request(app)
          .post(`/api/classes/${classId}/enroll`)
          .set('Authorization', `Bearer ${context.authToken}`)
          .send({ studentId });
      } catch (error) {
        // Ignore enrollment errors (might already be enrolled)
      }
    }
  }
};

/**
 * Creates test assessments for classes
 */
export const createTestAssessments = async (
  context: TestContext,
  classIds: string[],
  cleanup: TestDataCleanup
): Promise<void> => {
  const testTypes = ['quiz', 'exam', 'assignment', 'project'];

  for (const classId of classIds) {
    for (const testType of testTypes) {
      const response = await request(app)
        .post(`/api/classes/${classId}/tests`)
        .set('Authorization', `Bearer ${context.authToken}`)
        .send({
          title: `Test ${testType} for Class`,
          description: `Test ${testType} description`,
          testDate: new Date().toISOString().split('T')[0],
          totalPoints: 100,
          testType,
        });

      if (response.status === 201) {
        cleanup.testIds.push(response.body.data.id);
      }
    }
  }
};

/**
 * Creates test meetings for classes
 */
export const createTestMeetings = async (
  context: TestContext,
  classIds: string[],
  cleanup: TestDataCleanup
): Promise<void> => {
  for (const classId of classIds) {
    const response = await request(app)
      .post(`/api/classes/${classId}/meetings`)
      .set('Authorization', `Bearer ${context.authToken}`)
      .send({
        title: 'Test Meeting',
        description: 'Test meeting description',
        meetingDate: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '11:00',
        meetingType: 'in_person',
        location: 'Test Room',
      });

    if (response.status === 201) {
      cleanup.meetingIds.push(response.body.data.id);
    }
  }
};

/**
 * Validates API response structure
 */
export const validateApiResponse = (response: any, expectedData?: any) => {
  expect(response.body).toHaveProperty('success');
  expect(response.body.success).toBe(true);

  if (expectedData) {
    expect(response.body).toHaveProperty('data');
    if (Array.isArray(expectedData)) {
      expect(Array.isArray(response.body.data)).toBe(true);
    } else {
      expect(typeof response.body.data).toBe('object');
    }
  }
};

/**
 * Validates error response structure
 */
export const validateErrorResponse = (response: any, expectedCode?: string) => {
  expect(response.body).toHaveProperty('success');
  expect(response.body.success).toBe(false);
  expect(response.body).toHaveProperty('error');
  expect(response.body.error).toHaveProperty('code');
  expect(response.body.error).toHaveProperty('message');

  if (expectedCode) {
    expect(response.body.error.code).toBe(expectedCode);
  }
};

/**
 * Validates pagination response structure
 */
export const validatePaginationResponse = (response: any) => {
  validateApiResponse(response);
  expect(response.body).toHaveProperty('pagination');
  expect(response.body.pagination).toHaveProperty('page');
  expect(response.body.pagination).toHaveProperty('limit');
  expect(response.body.pagination).toHaveProperty('total');
  expect(response.body.pagination).toHaveProperty('totalPages');
};

/**
 * Waits for a specified amount of time
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retries a function until it succeeds or max attempts reached
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delay = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await wait(delay);
      }
    }
  }

  throw lastError!;
};

/**
 * Generates random test data
 */
export const generateRandomData = {
  email: () => `test${Math.random().toString(36).substring(7)}@example.com`,
  name: () => `Test User ${Math.random().toString(36).substring(7)}`,
  phone: () => `555-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
  className: () => `Test Class ${Math.random().toString(36).substring(7)}`,
  subject: () => ['Mathematics', 'Science', 'English', 'History', 'Art'][Math.floor(Math.random() * 5)],
  grade: () => ['9th', '10th', '11th', '12th'][Math.floor(Math.random() * 4)],
  color: () => ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][Math.floor(Math.random() * 5)],
};

/**
 * Database query helpers for testing
 */
export const dbHelpers = {
  async countRecords(prisma: PrismaClient, table: string): Promise<number> {
    const result = await (prisma as any)[table].count();
    return result;
  },

  async findRecord(prisma: PrismaClient, table: string, id: string): Promise<any> {
    const result = await (prisma as any)[table].findUnique({
      where: { id },
    });
    return result;
  },

  async deleteAllRecords(prisma: PrismaClient, table: string): Promise<void> {
    await (prisma as any)[table].deleteMany();
  },
};

/**
 * Mock data generators for specific entities
 */
export const mockDataGenerators = {
  user: (overrides = {}) => ({
    email: generateRandomData.email(),
    name: generateRandomData.name(),
    role: 'teacher',
    cognitoUserId: `cognito-${Math.random().toString(36).substring(7)}`,
    ...overrides,
  }),

  student: (overrides = {}) => ({
    name: generateRandomData.name(),
    email: generateRandomData.email(),
    phone: generateRandomData.phone(),
    grade: generateRandomData.grade(),
    parentContact: generateRandomData.email(),
    enrollmentDate: new Date(),
    ...overrides,
  }),

  class: (overrides = {}) => ({
    name: generateRandomData.className(),
    subject: generateRandomData.subject(),
    description: 'Test class description',
    room: `Room ${Math.floor(Math.random() * 100) + 1}`,
    capacity: Math.floor(Math.random() * 20) + 20,
    color: generateRandomData.color(),
    createdDate: new Date(),
    ...overrides,
  }),

  assessment: (classId: string, overrides = {}) => ({
    classId,
    title: `Test Assessment ${Math.random().toString(36).substring(7)}`,
    description: 'Test assessment description',
    testDate: new Date(),
    totalPoints: 100,
    testType: 'quiz',
    createdDate: new Date(),
    updatedDate: new Date(),
    ...overrides,
  }),

  meeting: (classId: string, overrides = {}) => ({
    classId,
    title: `Test Meeting ${Math.random().toString(36).substring(7)}`,
    description: 'Test meeting description',
    meetingDate: new Date(),
    startTime: '10:00',
    endTime: '11:00',
    meetingType: 'in_person',
    location: 'Test Room',
    createdDate: new Date(),
    updatedDate: new Date(),
    ...overrides,
  }),
};