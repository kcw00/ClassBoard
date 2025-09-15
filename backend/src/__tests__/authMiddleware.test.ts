import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { authenticateToken, authorizeRoles, optionalAuth, requireEmailVerification } from '../middleware/auth';

// Mock the auth service
jest.mock('../services/authService', () => ({
  authService: {
    getUserFromToken: jest.fn(),
  },
}));

import { authService } from '../services/authService';

const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token and set user', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'teacher',
        emailVerified: true,
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      mockAuthService.getUserFromToken.mockResolvedValueOnce(mockUser);

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuthService.getUserFromToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockRequest.accessToken).toBe('valid-token');
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 when no token provided', async () => {
      mockRequest.headers = {};

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      mockAuthService.getUserFromToken.mockRejectedValueOnce(new Error('Invalid token'));

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid access token format',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is expired', async () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-token',
      };

      mockAuthService.getUserFromToken.mockRejectedValueOnce(new Error('Token expired'));

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle malformed authorization header', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat',
      };

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authorizeRoles', () => {
    it('should allow access for authorized role', () => {
      mockRequest.user = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        emailVerified: true,
      };

      const middleware = authorizeRoles('admin', 'teacher');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access for unauthorized role', () => {
      mockRequest.user = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'student',
        emailVerified: true,
      };

      const middleware = authorizeRoles('admin', 'teacher');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Access denied. Required roles: admin, teacher',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access when user has no role', () => {
      mockRequest.user = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
      };

      const middleware = authorizeRoles('admin');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Access denied. Required roles: admin',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access when user is not authenticated', () => {
      mockRequest.user = undefined;

      const middleware = authorizeRoles('admin');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should set user when valid token provided', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'teacher',
        emailVerified: true,
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      mockAuthService.getUserFromToken.mockResolvedValueOnce(mockUser);

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(mockUser);
      expect(mockRequest.accessToken).toBe('valid-token');
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should continue without user when no token provided', async () => {
      mockRequest.headers = {};

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should continue without user when token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      mockAuthService.getUserFromToken.mockRejectedValueOnce(new Error('Invalid token'));

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('requireEmailVerification', () => {
    it('should allow access for verified user', () => {
      mockRequest.user = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'teacher',
        emailVerified: true,
      };

      requireEmailVerification(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access for unverified user', () => {
      mockRequest.user = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'teacher',
        emailVerified: false,
      };

      requireEmailVerification(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Email verification required',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access when user is not authenticated', () => {
      mockRequest.user = undefined;

      requireEmailVerification(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});