import jwt from 'jsonwebtoken';
import { CognitoUser } from '../../services/authService';

/**
 * Test authentication utilities for mocking Cognito authentication
 */

export interface TestAuthConfig {
  bypassAuth?: boolean;
  mockUser?: Partial<CognitoUser>;
}

let testAuthConfig: TestAuthConfig = {};

/**
 * Configure test authentication behavior
 */
export const configureTestAuth = (config: TestAuthConfig) => {
  testAuthConfig = { ...config };
};

/**
 * Reset test authentication to default state
 */
export const resetTestAuth = () => {
  testAuthConfig = {};
};

/**
 * Generate a valid JWT token for testing
 */
export const generateValidTestToken = (user: Partial<CognitoUser> = {}): string => {
  const defaultUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'teacher',
    emailVerified: true,
  };

  const userData = { ...defaultUser, ...user };
  
  const payload = {
    sub: userData.id,
    email: userData.email,
    'cognito:username': userData.email,
    'custom:role': userData.role,
    email_verified: userData.emailVerified,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
  };

  const secret = process.env.JWT_SECRET || 'test-secret-key';
  return jwt.sign(payload, secret);
};

/**
 * Mock the AuthService for testing
 */
export const mockAuthService = () => {
  const originalAuthService = require('../../services/authService').authService;
  
  // Mock getUserFromToken method
  originalAuthService.getUserFromToken = jest.fn().mockImplementation(async (token: string) => {
    if (testAuthConfig.bypassAuth) {
      return testAuthConfig.mockUser || {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'teacher',
        emailVerified: true,
      };
    }

    // Try to decode the JWT token
    try {
      const secret = process.env.JWT_SECRET || 'test-secret-key';
      const decoded = jwt.verify(token, secret) as any;
      
      return {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name || 'Test User',
        role: decoded['custom:role'] || 'teacher',
        emailVerified: decoded.email_verified || true,
      };
    } catch (error) {
      throw new Error('Invalid Access Token');
    }
  });

  return originalAuthService;
};

/**
 * Setup test authentication for E2E tests
 */
export const setupTestAuth = () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-for-e2e-tests';
  
  // Configure test auth to bypass Cognito
  configureTestAuth({
    bypassAuth: true,
    mockUser: {
      id: 'e2e-test-user',
      email: 'e2e@example.com',
      name: 'E2E Test User',
      role: 'teacher',
      emailVerified: true,
    },
  });

  // Mock the auth service
  mockAuthService();
};

/**
 * Cleanup test authentication
 */
export const cleanupTestAuth = () => {
  resetTestAuth();
  jest.restoreAllMocks();
};

/**
 * Create test request headers with authentication
 */
export const createAuthHeaders = (user?: Partial<CognitoUser>) => {
  const token = generateValidTestToken(user);
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Middleware to bypass authentication in test environment
 */
export const testAuthMiddleware = (req: any, res: any, next: any) => {
  if (process.env.NODE_ENV === 'test' && testAuthConfig.bypassAuth) {
    req.user = testAuthConfig.mockUser || {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'teacher',
      emailVerified: true,
    };
    req.accessToken = 'test-token';
    return next();
  }
  
  // Fall back to normal authentication
  const { authenticateToken } = require('../../middleware/auth');
  return authenticateToken(req, res, next);
};