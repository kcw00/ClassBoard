import { Request, Response, NextFunction } from 'express';
import { authService, CognitoUser } from '../services/authService';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: CognitoUser;
      accessToken?: string;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: CognitoUser;
  accessToken: string;
}

/**
 * Middleware to authenticate requests using Cognito access tokens
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Development bypass when Cognito is not configured
    if (process.env.NODE_ENV === 'development' && 
        (process.env.COGNITO_USER_POOL_ID === 'placeholder' || 
         !process.env.COGNITO_USER_POOL_ID)) {
      // Create a mock user for development
      req.user = {
        id: 'dev-user-1',
        email: 'dev@example.com',
        name: 'Development User',
        role: 'teacher',
        emailVerified: true
      };
      req.accessToken = 'dev-token';
      next();
      return;
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        requestId: (req as any).requestId,
      });
      return;
    }

    // Get user details from Cognito using the access token
    const user = await authService.getUserFromToken(token);

    // Attach user and token to request object
    req.user = user;
    req.accessToken = token;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Determine error type and respond accordingly
    let errorCode = 'INVALID_TOKEN';
    let errorMessage = 'Invalid or expired access token';
    let statusCode = 401;

    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        errorCode = 'TOKEN_EXPIRED';
        errorMessage = 'Access token has expired';
      } else if (error.message.includes('Invalid token')) {
        errorCode = 'INVALID_TOKEN';
        errorMessage = 'Invalid access token format';
      }
    }

    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
      timestamp: new Date().toISOString(),
      path: req.path,
      requestId: (req as any).requestId,
    });
  }
};

/**
 * Middleware to authorize requests based on user roles
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        requestId: (req as any).requestId,
      });
      return;
    }

    const userRole = req.user.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        requestId: (req as any).requestId,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware for optional authentication (doesn't fail if no token)
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const user = await authService.getUserFromToken(token);
        req.user = user;
        req.accessToken = token;
      } catch (error) {
        // Ignore authentication errors for optional auth
        console.warn('Optional auth failed:', error);
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

/**
 * Middleware to check if user email is verified
 */
export const requireEmailVerification = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication required',
      },
    });
    return;
  }

  if (!req.user.emailVerified) {
    res.status(403).json({
      success: false,
      error: {
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Email verification required',
      },
    });
    return;
  }

  next();
};

/**
 * Middleware to extract user ID from token for resource ownership checks
 */
export const extractUserId = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user) {
    // Add userId to request params for easy access in route handlers
    req.params.currentUserId = req.user.id;
  }
  next();
};

/**
 * Middleware to check if user owns the resource or is admin
 */
export const requireOwnershipOrAdmin = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const resourceUserId = req.params[userIdParam];
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    // Allow if user owns the resource or is admin
    if (currentUserId === resourceUserId || userRole === 'admin') {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      error: {
        code: 'ACCESS_DENIED',
        message: 'You can only access your own resources',
      },
    });
  };
};