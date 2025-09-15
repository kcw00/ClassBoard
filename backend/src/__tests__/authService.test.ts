import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AuthService } from '../services/authService';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  GetUserCommand,
  GlobalSignOutCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';

// Mock AWS SDK
jest.mock('@aws-sdk/client-cognito-identity-provider');

const mockCognitoClient = {
  send: jest.fn() as jest.MockedFunction<any>,
};

// Mock the AWS config
jest.mock('../config/aws', () => ({
  awsConfig: {
    aws: {
      cognito: {
        region: 'us-east-1',
        userPoolId: 'us-east-1_test123',
        clientId: 'test-client-id',
      },
    },
  },
  getCognitoConfig: jest.fn().mockReturnValue({
    region: 'us-east-1',
    userPoolId: 'us-east-1_test123',
    clientId: 'test-client-id',
  }),
}));

// Mock CognitoIdentityProviderClient
(CognitoIdentityProviderClient as jest.Mock).mockImplementation(() => mockCognitoClient);

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockAuthResult = {
        AuthenticationResult: {
          AccessToken: 'mock-access-token',
          RefreshToken: 'mock-refresh-token',
          IdToken: 'mock-id-token',
        },
      };

      const mockUserResponse = {
        Username: 'test-user-id',
        UserAttributes: [
          { Name: 'email', Value: 'test@example.com' },
          { Name: 'name', Value: 'Test User' },
          { Name: 'custom:role', Value: 'teacher' },
          { Name: 'email_verified', Value: 'true' },
        ],
      };

      mockCognitoClient.send
        .mockResolvedValueOnce(mockAuthResult) // InitiateAuthCommand
        .mockResolvedValueOnce(mockUserResponse); // GetUserCommand

      const result = await authService.login({
        email: 'test@example.com',
        password: 'TestPassword123',
      });

      expect(result).toEqual({
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
      });

      expect(mockCognitoClient.send).toHaveBeenCalledTimes(2);
      expect(mockCognitoClient.send).toHaveBeenCalledWith(expect.any(InitiateAuthCommand));
      expect(mockCognitoClient.send).toHaveBeenCalledWith(expect.any(GetUserCommand));
    });

    it('should throw error when authentication fails', async () => {
      mockCognitoClient.send.mockRejectedValueOnce(new Error('Incorrect username or password'));

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Login failed: Incorrect username or password');
    });

    it('should throw error when authentication result is missing', async () => {
      mockCognitoClient.send.mockResolvedValueOnce({});

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'TestPassword123',
        })
      ).rejects.toThrow('Authentication failed: No authentication result');
    });

    it('should throw error when challenge is required', async () => {
      mockCognitoClient.send.mockResolvedValueOnce({
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'TestPassword123',
        })
      ).rejects.toThrow('Authentication challenge required: NEW_PASSWORD_REQUIRED');
    });
  });

  describe('signUp', () => {
    it('should successfully sign up a new user', async () => {
      const mockSignUpResponse = {
        UserSub: 'test-user-sub',
        CodeDeliveryDetails: {
          Destination: 't***@example.com',
          DeliveryMedium: 'EMAIL',
        },
      };

      mockCognitoClient.send.mockResolvedValueOnce(mockSignUpResponse);

      const result = await authService.signUp({
        email: 'test@example.com',
        password: 'TestPassword123',
        name: 'Test User',
        role: 'teacher',
      });

      expect(result).toEqual({
        userSub: 'test-user-sub',
        codeDeliveryDetails: {
          Destination: 't***@example.com',
          DeliveryMedium: 'EMAIL',
        },
      });

      expect(mockCognitoClient.send).toHaveBeenCalledWith(expect.any(SignUpCommand));
    });

    it('should throw error when sign up fails', async () => {
      mockCognitoClient.send.mockRejectedValueOnce(new Error('UsernameExistsException'));

      await expect(
        authService.signUp({
          email: 'test@example.com',
          password: 'TestPassword123',
          name: 'Test User',
        })
      ).rejects.toThrow('Sign up failed: UsernameExistsException');
    });
  });

  describe('confirmSignUp', () => {
    it('should successfully confirm sign up', async () => {
      mockCognitoClient.send.mockResolvedValueOnce({});

      await expect(
        authService.confirmSignUp('test@example.com', '123456')
      ).resolves.not.toThrow();

      expect(mockCognitoClient.send).toHaveBeenCalledWith(expect.any(ConfirmSignUpCommand));
    });

    it('should throw error when confirmation fails', async () => {
      mockCognitoClient.send.mockRejectedValueOnce(new Error('CodeMismatchException'));

      await expect(
        authService.confirmSignUp('test@example.com', '123456')
      ).rejects.toThrow('Email confirmation failed: CodeMismatchException');
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      const mockRefreshResult = {
        AuthenticationResult: {
          AccessToken: 'new-access-token',
          IdToken: 'new-id-token',
          RefreshToken: 'new-refresh-token',
        },
      };

      const mockUserResponse = {
        Username: 'test-user-id',
        UserAttributes: [
          { Name: 'email', Value: 'test@example.com' },
          { Name: 'name', Value: 'Test User' },
          { Name: 'email_verified', Value: 'true' },
        ],
      };

      mockCognitoClient.send
        .mockResolvedValueOnce(mockRefreshResult)
        .mockResolvedValueOnce(mockUserResponse);

      const result = await authService.refreshToken({
        refreshToken: 'old-refresh-token',
      });

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        idToken: 'new-id-token',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: undefined,
          emailVerified: true,
        },
      });
    });

    it('should throw error when refresh fails', async () => {
      mockCognitoClient.send.mockRejectedValueOnce(new Error('Refresh Token has expired'));

      await expect(
        authService.refreshToken({ refreshToken: 'expired-token' })
      ).rejects.toThrow('Token refresh failed: Refresh Token has expired');
    });
  });

  describe('getUserFromToken', () => {
    it('should successfully get user from token', async () => {
      const mockUserResponse = {
        Username: 'test-user-id',
        UserAttributes: [
          { Name: 'email', Value: 'test@example.com' },
          { Name: 'name', Value: 'Test User' },
          { Name: 'custom:role', Value: 'teacher' },
          { Name: 'email_verified', Value: 'true' },
        ],
      };

      mockCognitoClient.send.mockResolvedValueOnce(mockUserResponse);

      const result = await authService.getUserFromToken('valid-access-token');

      expect(result).toEqual({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'teacher',
        emailVerified: true,
      });

      expect(mockCognitoClient.send).toHaveBeenCalledWith(expect.any(GetUserCommand));
    });

    it('should throw error when token is invalid', async () => {
      mockCognitoClient.send.mockRejectedValueOnce(new Error('Invalid Access Token'));

      await expect(
        authService.getUserFromToken('invalid-token')
      ).rejects.toThrow('Failed to get user details: Invalid Access Token');
    });
  });

  describe('signOut', () => {
    it('should successfully sign out user', async () => {
      mockCognitoClient.send.mockResolvedValueOnce({});

      await expect(
        authService.signOut('valid-access-token')
      ).resolves.not.toThrow();

      expect(mockCognitoClient.send).toHaveBeenCalledWith(expect.any(GlobalSignOutCommand));
    });

    it('should throw error when sign out fails', async () => {
      mockCognitoClient.send.mockRejectedValueOnce(new Error('Invalid Access Token'));

      await expect(
        authService.signOut('invalid-token')
      ).rejects.toThrow('Sign out failed: Invalid Access Token');
    });
  });

  describe('forgotPassword', () => {
    it('should successfully initiate forgot password', async () => {
      mockCognitoClient.send.mockResolvedValueOnce({});

      await expect(
        authService.forgotPassword({ email: 'test@example.com' })
      ).resolves.not.toThrow();

      expect(mockCognitoClient.send).toHaveBeenCalledWith(expect.any(ForgotPasswordCommand));
    });

    it('should throw error when forgot password fails', async () => {
      mockCognitoClient.send.mockRejectedValueOnce(new Error('UserNotFoundException'));

      await expect(
        authService.forgotPassword({ email: 'test@example.com' })
      ).rejects.toThrow('Forgot password failed: UserNotFoundException');
    });
  });

  describe('confirmForgotPassword', () => {
    it('should successfully confirm forgot password', async () => {
      mockCognitoClient.send.mockResolvedValueOnce({});

      await expect(
        authService.confirmForgotPassword({
          email: 'test@example.com',
          confirmationCode: '123456',
          newPassword: 'NewPassword123',
        })
      ).resolves.not.toThrow();

      expect(mockCognitoClient.send).toHaveBeenCalledWith(expect.any(ConfirmForgotPasswordCommand));
    });

    it('should throw error when confirm forgot password fails', async () => {
      mockCognitoClient.send.mockRejectedValueOnce(new Error('CodeMismatchException'));

      await expect(
        authService.confirmForgotPassword({
          email: 'test@example.com',
          confirmationCode: '123456',
          newPassword: 'NewPassword123',
        })
      ).rejects.toThrow('Password reset failed: CodeMismatchException');
    });
  });

  describe('resendConfirmationCode', () => {
    it('should successfully resend confirmation code', async () => {
      mockCognitoClient.send.mockResolvedValueOnce({});

      await expect(
        authService.resendConfirmationCode('test@example.com')
      ).resolves.not.toThrow();

      expect(mockCognitoClient.send).toHaveBeenCalledWith(expect.any(ResendConfirmationCodeCommand));
    });

    it('should throw error when resend fails', async () => {
      mockCognitoClient.send.mockRejectedValueOnce(new Error('UserNotFoundException'));

      await expect(
        authService.resendConfirmationCode('test@example.com')
      ).rejects.toThrow('Resend confirmation failed: UserNotFoundException');
    });
  });
});