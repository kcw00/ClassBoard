// Jest setup file
// This file runs before all tests and sets up global configurations
import jwt from 'jsonwebtoken';

// Set test timeout
jest.setTimeout(10000);

// Test token generation utility
export const generateTestToken = (userId = 'test-user-id', email = 'test@example.com') => {
  const payload = {
    sub: userId,
    email,
    'cognito:username': email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
  };
  
  // Use a test secret or the actual JWT secret
  const secret = process.env.JWT_SECRET || 'test-secret-key';
  return jwt.sign(payload, secret);
};

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  // Uncomment the next line to hide logs during tests
  // log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test environment setup
beforeAll(() => {
  // Setup before all tests
});

afterAll(() => {
  // Cleanup after all tests
});

beforeEach(() => {
  // Setup before each test
});

afterEach(() => {
  // Cleanup after each test
  jest.clearAllMocks();
});