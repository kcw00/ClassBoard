import { Request, Response, NextFunction } from 'express';
import config from '../config';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
  isOperational?: boolean;
}

// Enhanced error logging with structured format
const logError = (err: ApiError, req: Request) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message: err.message,
    statusCode: err.statusCode || 500,
    code: err.code || 'INTERNAL_ERROR',
    path: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: (req as any).user?.id || 'anonymous',
    requestId: (req as any).requestId,
    stack: err.stack,
    isOperational: err.isOperational || false,
  };

  // In production, log to structured format for monitoring systems
  if (config.server.nodeEnv === 'production') {
    console.error(JSON.stringify(errorLog));
  } else {
    console.error('Error Details:', errorLog);
  }

  // Log critical errors separately for alerting
  if ((err.statusCode || 500) >= 500) {
    console.error('CRITICAL ERROR:', JSON.stringify({
      ...errorLog,
      alert: true,
      severity: 'critical',
    }));
  }
};

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log the error with enhanced details
  logError(err, req);

  // Determine if error details should be exposed
  const shouldExposeDetails = config.server.nodeEnv === 'development' || err.isOperational;

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: shouldExposeDetails ? message : 'An error occurred',
      ...(shouldExposeDetails && err.details && { details: err.details }),
    },
    timestamp: new Date().toISOString(),
    path: req.path,
    requestId: (req as any).requestId,
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};