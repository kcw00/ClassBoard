import { Router, Request, Response } from 'express';
import { authService } from '../services/authService';
import { authenticateToken } from '../middleware/auth';
import { validateLoginRequest, validateSignUpRequest, validateRefreshTokenRequest, validateForgotPasswordRequest, validateResetPasswordRequest, validateConfirmSignUpRequest } from '../validators/authValidators';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 */
router.post('/login', validateLoginRequest, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    const authResult = await authService.login({ email, password });
    
    res.json({
      success: true,
      data: {
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
        idToken: authResult.idToken,
        user: authResult.user,
      },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login route error:', error);
    
    let statusCode = 401;
    let errorCode = 'LOGIN_FAILED';
    let errorMessage = 'Invalid email or password';

    if (error instanceof Error) {
      if (error.message.includes('User does not exist')) {
        errorCode = 'USER_NOT_FOUND';
        errorMessage = 'User not found';
      } else if (error.message.includes('Incorrect username or password')) {
        errorCode = 'INVALID_CREDENTIALS';
        errorMessage = 'Invalid email or password';
      } else if (error.message.includes('User is not confirmed')) {
        errorCode = 'USER_NOT_CONFIRMED';
        errorMessage = 'Please verify your email address';
        statusCode = 403;
      } else if (error.message.includes('Password attempts exceeded')) {
        errorCode = 'TOO_MANY_ATTEMPTS';
        errorMessage = 'Too many failed login attempts. Please try again later';
        statusCode = 429;
      }
    }

    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    });
  }
});

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post('/signup', validateSignUpRequest, async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;
    
    const result = await authService.signUp({ email, password, name, role });
    
    res.status(201).json({
      success: true,
      data: {
        userSub: result.userSub,
        codeDeliveryDetails: result.codeDeliveryDetails,
      },
      message: 'User registered successfully. Please check your email for verification code.',
    });
  } catch (error) {
    console.error('Signup route error:', error);
    
    let statusCode = 400;
    let errorCode = 'SIGNUP_FAILED';
    let errorMessage = 'Failed to create user account';

    if (error instanceof Error) {
      if (error.message.includes('UsernameExistsException')) {
        errorCode = 'USER_EXISTS';
        errorMessage = 'User with this email already exists';
        statusCode = 409;
      } else if (error.message.includes('InvalidPasswordException')) {
        errorCode = 'INVALID_PASSWORD';
        errorMessage = 'Password does not meet requirements';
      } else if (error.message.includes('InvalidParameterException')) {
        errorCode = 'INVALID_PARAMETER';
        errorMessage = 'Invalid email format';
      }
    }

    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    });
  }
});

/**
 * POST /api/auth/confirm-signup
 * Confirm user registration with verification code
 */
router.post('/confirm-signup', validateConfirmSignUpRequest, async (req: Request, res: Response) => {
  try {
    const { email, confirmationCode } = req.body;
    
    await authService.confirmSignUp(email, confirmationCode);
    
    res.json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (error) {
    console.error('Confirm signup route error:', error);
    
    let statusCode = 400;
    let errorCode = 'CONFIRMATION_FAILED';
    let errorMessage = 'Failed to verify email';

    if (error instanceof Error) {
      if (error.message.includes('CodeMismatchException')) {
        errorCode = 'INVALID_CODE';
        errorMessage = 'Invalid verification code';
      } else if (error.message.includes('ExpiredCodeException')) {
        errorCode = 'EXPIRED_CODE';
        errorMessage = 'Verification code has expired';
      } else if (error.message.includes('UserNotFoundException')) {
        errorCode = 'USER_NOT_FOUND';
        errorMessage = 'User not found';
        statusCode = 404;
      }
    }

    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    });
  }
});

/**
 * POST /api/auth/resend-confirmation
 * Resend verification code
 */
router.post('/resend-confirmation', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_EMAIL',
          message: 'Email is required',
        },
      });
      return;
    }
    
    await authService.resendConfirmationCode(email);
    
    res.json({
      success: true,
      message: 'Verification code sent to your email',
    });
  } catch (error) {
    console.error('Resend confirmation route error:', error);
    
    res.status(400).json({
      success: false,
      error: {
        code: 'RESEND_FAILED',
        message: 'Failed to resend verification code',
      },
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', validateRefreshTokenRequest, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    const authResult = await authService.refreshToken({ refreshToken });
    
    res.json({
      success: true,
      data: {
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
        idToken: authResult.idToken,
        user: authResult.user,
      },
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    console.error('Refresh token route error:', error);
    
    let statusCode = 401;
    let errorCode = 'REFRESH_FAILED';
    let errorMessage = 'Failed to refresh token';

    if (error instanceof Error) {
      if (error.message.includes('Refresh Token has expired')) {
        errorCode = 'REFRESH_TOKEN_EXPIRED';
        errorMessage = 'Refresh token has expired. Please log in again';
      } else if (error.message.includes('Invalid Refresh Token')) {
        errorCode = 'INVALID_REFRESH_TOKEN';
        errorMessage = 'Invalid refresh token';
      }
    }

    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    });
  }
});

/**
 * POST /api/auth/logout
 * Sign out user (invalidate all tokens)
 */
router.post('/logout', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.accessToken) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required',
        },
      });
      return;
    }
    
    await authService.signOut(req.accessToken);
    
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout route error:', error);
    
    // Even if logout fails, we should return success to the client
    // since the token might already be invalid
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'User not authenticated',
        },
      });
      return;
    }
    
    res.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    console.error('Get user route error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_USER_FAILED',
        message: 'Failed to get user information',
      },
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Initiate forgot password flow
 */
router.post('/forgot-password', validateForgotPasswordRequest, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    await authService.forgotPassword({ email });
    
    res.json({
      success: true,
      message: 'Password reset code sent to your email',
    });
  } catch (error) {
    console.error('Forgot password route error:', error);
    
    // Always return success for security reasons (don't reveal if email exists)
    res.json({
      success: true,
      message: 'If the email exists, a password reset code has been sent',
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with confirmation code
 */
router.post('/reset-password', validateResetPasswordRequest, async (req: Request, res: Response) => {
  try {
    const { email, confirmationCode, newPassword } = req.body;
    
    await authService.confirmForgotPassword({ email, confirmationCode, newPassword });
    
    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password route error:', error);
    
    let statusCode = 400;
    let errorCode = 'RESET_FAILED';
    let errorMessage = 'Failed to reset password';

    if (error instanceof Error) {
      if (error.message.includes('CodeMismatchException')) {
        errorCode = 'INVALID_CODE';
        errorMessage = 'Invalid reset code';
      } else if (error.message.includes('ExpiredCodeException')) {
        errorCode = 'EXPIRED_CODE';
        errorMessage = 'Reset code has expired';
      } else if (error.message.includes('InvalidPasswordException')) {
        errorCode = 'INVALID_PASSWORD';
        errorMessage = 'Password does not meet requirements';
      }
    }

    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    });
  }
});

export default router;