// Jest setup file
// This file runs before all tests and sets up global configurations
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// Set test timeout
jest.setTimeout(30000);

// Test database setup
let testDb: PrismaClient;

// Test token generation utility
export const generateTestToken = (userId = 'test-user-id', email = 'test@example.com', role = 'teacher') => {
  const payload = {
    sub: userId,
    email,
    'cognito:username': email,
    'custom:role': role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
  };
  
  // Use a test secret or the actual JWT secret
  const secret = process.env.JWT_SECRET || 'test-secret-key';
  return jwt.sign(payload, secret);
};

// Test data factories
export const createTestUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'teacher',
  cognitoUserId: 'cognito-test-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestStudent = (overrides = {}) => ({
  id: 'test-student-id',
  name: 'Test Student',
  email: 'student@example.com',
  phone: '123-456-7890',
  grade: '10th',
  parentContact: 'parent@example.com',
  enrollmentDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestClass = (overrides = {}) => ({
  id: 'test-class-id',
  name: 'Test Class',
  subject: 'Mathematics',
  description: 'Test class description',
  room: 'Room 101',
  capacity: 30,
  color: '#3B82F6',
  createdDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestAssessment = (overrides = {}) => ({
  id: 'test-assessment-id',
  classId: 'test-class-id',
  title: 'Test Assessment',
  description: 'Test assessment description',
  testDate: new Date(),
  totalPoints: 100,
  testType: 'quiz' as const,
  createdDate: new Date(),
  updatedDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Performance testing utilities
export const measureResponseTime = async (fn: () => Promise<any>): Promise<{ result: any; duration: number }> => {
  const start = process.hrtime.bigint();
  const result = await fn();
  const end = process.hrtime.bigint();
  const duration = Number(end - start) / 1000000; // Convert to milliseconds
  return { result, duration };
};

export const runPerformanceTest = async (
  testFn: () => Promise<any>,
  iterations = 100,
  maxResponseTime = 1000
): Promise<{ averageTime: number; maxTime: number; minTime: number; passed: boolean }> => {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const { duration } = await measureResponseTime(testFn);
    times.push(duration);
  }
  
  const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);
  const passed = averageTime <= maxResponseTime;
  
  return { averageTime, maxTime, minTime, passed };
};

// Database utilities for testing
export const getTestDatabase = () => {
  if (!testDb) {
    testDb = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
        },
      },
    });
  }
  return testDb;
};

export const cleanupTestDatabase = async () => {
  if (testDb) {
    // Clean up test data in reverse order of dependencies
    await testDb.testResult.deleteMany();
    await testDb.test.deleteMany();
    await testDb.attendanceRecord.deleteMany();
    await testDb.meeting.deleteMany();
    await testDb.classNote.deleteMany();
    await testDb.homeworkSubmission.deleteMany();
    await testDb.homeworkAssignment.deleteMany();
    await testDb.scheduleException.deleteMany();
    await testDb.schedule.deleteMany();
    await testDb.classEnrollment.deleteMany();
    await testDb.class.deleteMany();
    await testDb.student.deleteMany();
    await testDb.user.deleteMany();
  }
};

// Mock console methods in tests to reduce noise
const originalConsole = global.console;
global.console = {
  ...console,
  // Uncomment the next line to hide logs during tests
  // log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: originalConsole.error, // Keep error logs for debugging
};

// Global test environment setup
beforeAll(async () => {
  // Setup test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
  
  // Initialize test database if needed
  if (process.env.TEST_DATABASE_URL) {
    testDb = getTestDatabase();
  }
});

afterAll(async () => {
  // Cleanup after all tests
  if (testDb) {
    await testDb.$disconnect();
  }
});

beforeEach(async () => {
  // Setup before each test
  if (testDb && process.env.CLEAN_DB_BEFORE_EACH === 'true') {
    await cleanupTestDatabase();
  }
});

afterEach(async () => {
  // Cleanup after each test
  jest.clearAllMocks();
  
  // Clean up test database after each test if configured
  if (testDb && process.env.CLEAN_DB_AFTER_EACH !== 'false') {
    await cleanupTestDatabase();
  }
});