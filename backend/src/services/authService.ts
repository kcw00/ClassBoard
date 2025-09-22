import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  GetUserCommand,
  GlobalSignOutCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  AuthFlowType,
  ChallengeNameType,
} from '@aws-sdk/client-cognito-identity-provider';
import jwt from 'jsonwebtoken';
import { awsConfig, getCognitoConfig } from '../config/aws';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  user: CognitoUser;
}

export interface CognitoUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  emailVerified: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  confirmationCode: string;
  newPassword: string;
}

export class AuthService {
  private cognitoClient: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;

  constructor() {
    const cognitoConfig = getCognitoConfig(awsConfig);
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: cognitoConfig.region,
    });
    this.userPoolId = cognitoConfig.userPoolId;
    this.clientId = cognitoConfig.clientId;
  }

  /**
   * Authenticate user with email and password
   */
  async login(loginRequest: LoginRequest): Promise<AuthResult> {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_SRP_AUTH,
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: loginRequest.email,
          PASSWORD: loginRequest.password,
        },
      });

      const response = await this.cognitoClient.send(command);

      if (response.ChallengeName) {
        throw new Error(`Authentication challenge required: ${response.ChallengeName}`);
      }

      if (!response.AuthenticationResult) {
        throw new Error('Authentication failed: No authentication result');
      }

      const { AccessToken, RefreshToken, IdToken } = response.AuthenticationResult;

      if (!AccessToken || !RefreshToken || !IdToken) {
        throw new Error('Authentication failed: Missing tokens');
      }

      // Get user details
      const user = await this.getUserFromToken(AccessToken);

      return {
        accessToken: AccessToken,
        refreshToken: RefreshToken,
        idToken: IdToken,
        user,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sign up a new user
   */
  async signUp(signUpRequest: SignUpRequest): Promise<{ userSub: string; codeDeliveryDetails?: any }> {
    try {
      const userAttributes = [
        {
          Name: 'email',
          Value: signUpRequest.email,
        },
        {
          Name: 'name',
          Value: signUpRequest.name,
        },
      ];

      if (signUpRequest.role) {
        userAttributes.push({
          Name: 'custom:role',
          Value: signUpRequest.role,
        });
      }

      const command = new SignUpCommand({
        ClientId: this.clientId,
        Username: signUpRequest.email,
        Password: signUpRequest.password,
        UserAttributes: userAttributes,
      });

      const response = await this.cognitoClient.send(command);

      if (!response.UserSub) {
        throw new Error('Sign up failed: No user ID returned');
      }

      return {
        userSub: response.UserSub,
        codeDeliveryDetails: response.CodeDeliveryDetails,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      throw new Error(`Sign up failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Confirm user sign up with verification code
   */
  async confirmSignUp(email: string, confirmationCode: string): Promise<void> {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.clientId,
        Username: email,
        ConfirmationCode: confirmationCode,
      });

      await this.cognitoClient.send(command);
    } catch (error) {
      console.error('Confirm sign up error:', error);
      throw new Error(`Email confirmation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Resend confirmation code
   */
  async resendConfirmationCode(email: string): Promise<void> {
    try {
      const command = new ResendConfirmationCodeCommand({
        ClientId: this.clientId,
        Username: email,
      });

      await this.cognitoClient.send(command);
    } catch (error) {
      console.error('Resend confirmation code error:', error);
      throw new Error(`Resend confirmation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshTokenRequest: RefreshTokenRequest): Promise<AuthResult> {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
        ClientId: this.clientId,
        AuthParameters: {
          REFRESH_TOKEN: refreshTokenRequest.refreshToken,
        },
      });

      const response = await this.cognitoClient.send(command);

      if (!response.AuthenticationResult) {
        throw new Error('Token refresh failed: No authentication result');
      }

      const { AccessToken, IdToken } = response.AuthenticationResult;
      const refreshToken = response.AuthenticationResult.RefreshToken || refreshTokenRequest.refreshToken;

      if (!AccessToken || !IdToken) {
        throw new Error('Token refresh failed: Missing tokens');
      }

      // Get user details
      const user = await this.getUserFromToken(AccessToken);

      return {
        accessToken: AccessToken,
        refreshToken,
        idToken: IdToken,
        user,
      };
    } catch (error) {
      console.error('Refresh token error:', error);
      throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user details from access token
   */
  async getUserFromToken(accessToken: string): Promise<CognitoUser> {
    try {
      const command = new GetUserCommand({
        AccessToken: accessToken,
      });

      const response = await this.cognitoClient.send(command);

      if (!response.Username || !response.UserAttributes) {
        throw new Error('Failed to get user details');
      }

      const attributes = response.UserAttributes.reduce((acc, attr) => {
        if (attr.Name && attr.Value) {
          acc[attr.Name] = attr.Value;
        }
        return acc;
      }, {} as Record<string, string>);

      return {
        id: response.Username,
        email: attributes.email || '',
        name: attributes.name || '',
        role: attributes['custom:role'],
        emailVerified: attributes.email_verified === 'true',
      };
    } catch (error) {
      console.error('Get user from token error:', error);
      throw new Error(`Failed to get user details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sign out user globally (invalidate all tokens)
   */
  async signOut(accessToken: string): Promise<void> {
    try {
      const command = new GlobalSignOutCommand({
        AccessToken: accessToken,
      });

      await this.cognitoClient.send(command);
    } catch (error) {
      console.error('Sign out error:', error);
      throw new Error(`Sign out failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initiate forgot password flow
   */
  async forgotPassword(forgotPasswordRequest: ForgotPasswordRequest): Promise<void> {
    try {
      const command = new ForgotPasswordCommand({
        ClientId: this.clientId,
        Username: forgotPasswordRequest.email,
      });

      await this.cognitoClient.send(command);
    } catch (error) {
      console.error('Forgot password error:', error);
      throw new Error(`Forgot password failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Confirm forgot password with new password
   */
  async confirmForgotPassword(resetPasswordRequest: ResetPasswordRequest): Promise<void> {
    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: this.clientId,
        Username: resetPasswordRequest.email,
        ConfirmationCode: resetPasswordRequest.confirmationCode,
        Password: resetPasswordRequest.newPassword,
      });

      await this.cognitoClient.send(command);
    } catch (error) {
      console.error('Confirm forgot password error:', error);
      throw new Error(`Password reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify JWT token (for middleware use)
   */
  verifyJWT(token: string): any {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Decode JWT token without verification (for extracting claims)
   */
  decodeJWT(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }

  /**
   * Update user attributes (admin function)
   */
  async updateUserAttributes(email: string, attributes: Record<string, string>): Promise<void> {
    try {
      const userAttributes = Object.entries(attributes).map(([name, value]) => ({
        Name: name.startsWith('custom:') ? name : `custom:${name}`,
        Value: value,
      }));

      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: this.userPoolId,
        Username: email,
        UserAttributes: userAttributes,
      });

      await this.cognitoClient.send(command);
    } catch (error) {
      console.error('Update user attributes error:', error);
      throw new Error(`Failed to update user attributes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();