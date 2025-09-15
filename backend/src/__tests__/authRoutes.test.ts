import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth';

// Mock the auth service
jest.mock('../services/authService', () => ({
  authService: {
    login: jest.fn(),
    signUp: jest.fn(),
    confirmSignUp: jest.fn(),
    refreshToken: jest.fn(),
    forgotPassword: jest.fn(),
    confirmForgotPassword: jest.fn(),
    getUserFromToken: jest.fn(),
    signOut: jest.fn(),
  },
}));

import { authService } from '../services/authService';
jest.mock('../validators/authValidators', () => ({
  validateLoginRequest: (req: any, res: any, next: any) => next(),
  validateSignUpRequest: (req: any, res: any, next: any) => next(),
  validateRefreshTokenRequest: (req: any, res: any, next: any) => next(),
  validateForgotPasswordRequest: (req: any, res: any, next: any) => next(),
  validateResetPasswordRequest: (req: any, res: any, next: any) => next(),
  validateConfirmSignUpRequest: (req: any, res: any, next: any) => next(),
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;

// Create test app
const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockAuthResult = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        idToken: 'mock-id-token',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'teacher',
          emailVerified: true,
        },
      };

      mockAuthService.login.mockResolvedValueOnce(mockAuthResult);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockAuthResult,
        message: 'Login successful',
      });
      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'TestPassword123',
      });
    });

    it('should return 401 for invalid credentials', async () => {
      mockAuthService.login.mockRejectedValueOnce(new Error('Incorrect username or password'));

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    });

    it('should return 403 for unconfirmed user', async () => {
      mockAuthService.login.mockRejectedValueOnce(new Error('User is not confirmed'));

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123',
        });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'USER_NOT_CONFIRMED',
          message: 'Please verify your email address',
        },
      });
    });

    it('should return 429 for too many attempts', async () => {
      mockAuthService.login.mockRejectedValueOnce(new Error('Password attempts exceeded'));

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123',
        });

      expect(response.status).toBe(429);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'TOO_MANY_ATTEMPTS',
          message: 'Too many failed login attempts. Please try again later',
        },
      });
    });
  });

  describe('POST /auth/signup', () => {
    it('should signup successfully with valid data', async () => {
      const mockSignUpResult = {
        userSub: 'test-user-sub',
        codeDeliveryDetails: {
          Destination: 't***@example.com',
          DeliveryMedium: 'EMAIL',
        },
      };

      mockAuthService.signUp.mockResolvedValueOnce(mockSignUpResult);

      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123',
          name: 'Test User',
          role: 'teacher',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: mockSignUpResult,
        message: 'User registered successfully. Please check your email for verification code.',
      });
      expect(mockAuthService.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'TestPassword123',
        name: 'Test User',
        role: 'teacher',
      });
    });

    it('should return 409 for existing user', async () => {
      mockAuthService.signUp.mockRejectedValueOnce(new Error('UsernameExistsException'));

      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123',
          name: 'Test User',
        });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists',
        },
      });
    });

    it('should return 400 for invalid password', async () => {
      mockAuthService.signUp.mockRejectedValueOnce(new Error('InvalidPasswordException'));

      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'weak',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Password does not meet requirements',
        },
      });
    });
  });

  describe('POST /auth/confirm-signup', () => {
    it('should confirm signup successfully', async () => {
      mockAuthService.confirmSignUp.mockResolvedValueOnce();

      const response = await request(app)
        .post('/auth/confirm-signup')
        .send({
          email: 'test@example.com',
          confirmationCode: '123456',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Email verified successfully. You can now log in.',
      });
      expect(mockAuthService.confirmSignUp).toHaveBeenCalledWith('test@example.com', '123456');
    });

    it('should return 400 for invalid code', async () => {
      mockAuthService.confirmSignUp.mockRejectedValueOnce(new Error('CodeMismatchException'));

      const response = await request(app)
        .post('/auth/confirm-signup')
        .send({
          email: 'test@example.com',
          confirmationCode: '123456',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INVALID_CODE',
          message: 'Invalid verification code',
        },
      });
    });

    it('should return 400 for expired code', async () => {
      mockAuthService.confirmSignUp.mockRejectedValueOnce(new Error('ExpiredCodeException'));

      const response = await request(app)
        .post('/auth/confirm-signup')
        .send({
          email: 'test@example.com',
          confirmationCode: '123456',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'EXPIRED_CODE',
          message: 'Verification code has expired',
        },
      });
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh token successfully', async () => {
      const mockRefreshResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        idToken: 'new-id-token',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'teacher',
          emailVerified: true,
        },
      };

      mockAuthService.refreshToken.mockResolvedValueOnce(mockRefreshResult);

      const response = await request(app)
        .post('/auth/refresh')
        .send({
          refreshToken: 'old-refresh-token',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockRefreshResult,
        message: 'Token refreshed successfully',
      });
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith({
        refreshToken: 'old-refresh-token',
      });
    });

    it('should return 401 for expired refresh token', async () => {
      mockAuthService.refreshToken.mockRejectedValueOnce(new Error('Refresh Token has expired'));

      const response = await request(app)
        .post('/auth/refresh')
        .send({
          refreshToken: 'expired-token',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'REFRESH_TOKEN_EXPIRED',
          message: 'Refresh token has expired. Please log in again',
        },
      });
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should initiate forgot password successfully', async () => {
      mockAuthService.forgotPassword.mockResolvedValueOnce();

      const response = await request(app)
        .post('/auth/forgot-password')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Password reset code sent to your email',
      });
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    it('should return success even for non-existent user (security)', async () => {
      mockAuthService.forgotPassword.mockRejectedValueOnce(new Error('UserNotFoundException'));

      const response = await request(app)
        .post('/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'If the email exists, a password reset code has been sent',
      });
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should reset password successfully', async () => {
      mockAuthService.confirmForgotPassword.mockResolvedValueOnce();

      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          email: 'test@example.com',
          confirmationCode: '123456',
          newPassword: 'NewPassword123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Password reset successfully',
      });
      expect(mockAuthService.confirmForgotPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        confirmationCode: '123456',
        newPassword: 'NewPassword123',
      });
    });

    it('should return 400 for invalid reset code', async () => {
      mockAuthService.confirmForgotPassword.mockRejectedValueOnce(new Error('CodeMismatchException'));

      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          email: 'test@example.com',
          confirmationCode: '123456',
          newPassword: 'NewPassword123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INVALID_CODE',
          message: 'Invalid reset code',
        },
      });
    });
  });
});