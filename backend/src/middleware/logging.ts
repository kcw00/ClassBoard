import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';

// Extend Request interface to include requestId and startTime
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

// Request ID middleware - adds unique ID to each request
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.requestId = uuidv4();
  req.startTime = Date.now();
  
  // Add request ID to response headers for debugging
  res.setHeader('X-Request-ID', req.requestId);
  
  next();
};

// Enhanced request/response logging middleware
export const requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log incoming request
  const requestLog = {
    timestamp: new Date().toISOString(),
    level: 'info',
    type: 'request',
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: (req as any).user?.id || 'anonymous',
    contentLength: req.get('Content-Length') || '0',
  };

  if (config.server.nodeEnv === 'production') {
    console.log(JSON.stringify(requestLog));
  } else {
    console.log(`[${req.requestId}] ${req.method} ${req.path}`);
  }

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body: any) {
    const responseTime = Date.now() - startTime;
    
    const responseLog = {
      timestamp: new Date().toISOString(),
      level: 'info',
      type: 'response',
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      contentLength: JSON.stringify(body).length,
      userId: (req as any).user?.id || 'anonymous',
    };

    if (config.server.nodeEnv === 'production') {
      console.log(JSON.stringify(responseLog));
    } else {
      console.log(`[${req.requestId}] ${res.statusCode} ${responseTime}ms`);
    }

    // Log slow requests for performance monitoring
    if (responseTime > 1000) {
      console.warn('SLOW REQUEST:', JSON.stringify({
        ...responseLog,
        alert: true,
        severity: 'warning',
        threshold: '1000ms',
      }));
    }

    return originalJson.call(this, body);
  };

  next();
};

// Performance monitoring middleware
export const performanceMonitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    // Log performance metrics
    const performanceLog = {
      timestamp: new Date().toISOString(),
      level: 'info',
      type: 'performance',
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    };

    // Only log in production for monitoring systems
    if (config.server.nodeEnv === 'production') {
      console.log(JSON.stringify(performanceLog));
    }

    // Alert on performance issues
    if (duration > 5000) { // 5 seconds
      console.error('PERFORMANCE ALERT:', JSON.stringify({
        ...performanceLog,
        alert: true,
        severity: 'critical',
        threshold: '5000ms',
      }));
    } else if (duration > 2000) { // 2 seconds
      console.warn('PERFORMANCE WARNING:', JSON.stringify({
        ...performanceLog,
        alert: true,
        severity: 'warning',
        threshold: '2000ms',
      }));
    }
  });

  next();
};