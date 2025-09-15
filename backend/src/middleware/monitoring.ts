import { Request, Response, NextFunction } from 'express';
import { monitoringService } from '../services/monitoringService';

// Middleware to record API metrics and errors
export const apiMonitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Override res.json to capture response details
  const originalJson = res.json;
  res.json = function(body: any) {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Record API response time
    monitoringService.recordApiResponseTime(
      req.method,
      req.route?.path || req.path,
      responseTime,
      statusCode
    );
    
    // Record API errors
    if (statusCode >= 400) {
      const errorMessage = body?.error?.message || body?.message || 'Unknown error';
      monitoringService.recordApiError(
        req.method,
        req.route?.path || req.path,
        statusCode,
        errorMessage
      );
    }
    
    // Record successful API calls
    if (statusCode >= 200 && statusCode < 300) {
      monitoringService.recordMetric({
        name: 'api.success_count',
        value: 1,
        unit: 'count',
        tags: {
          method: req.method,
          path: req.route?.path || req.path,
          status_code: statusCode.toString(),
        },
      });
    }
    
    return originalJson.call(this, body);
  };
  
  next();
};

// Middleware to track database query performance
export const databaseMonitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Add database query tracking to request object
  (req as any).trackDbQuery = (queryName: string, duration: number) => {
    monitoringService.recordMetric({
      name: 'database.query_time',
      value: duration,
      unit: 'milliseconds',
      tags: {
        query: queryName,
        endpoint: req.route?.path || req.path,
      },
    });
    
    // Alert on slow queries
    if (duration > 1000) {
      monitoringService.sendAlert({
        level: 'warning',
        message: `Slow database query: ${queryName} took ${duration}ms`,
        service: 'database',
        metadata: {
          query: queryName,
          duration,
          endpoint: req.route?.path || req.path,
        },
      });
    }
  };
  
  next();
};

// Middleware to track authentication events
export const authMonitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Track authentication attempts
  if (req.path.includes('/auth/login')) {
    const originalJson = res.json;
    res.json = function(body: any) {
      const success = body?.success || false;
      
      monitoringService.recordMetric({
        name: 'auth.login_attempts',
        value: 1,
        unit: 'count',
        tags: {
          success: success.toString(),
          ip: req.ip || 'unknown',
        },
      });
      
      if (!success) {
        monitoringService.sendAlert({
          level: 'warning',
          message: `Failed login attempt from ${req.ip}`,
          service: 'auth',
          metadata: {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString(),
          },
        });
      }
      
      return originalJson.call(this, body);
    };
  }
  
  next();
};

// Middleware to track file operations
export const fileMonitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.path.includes('/files')) {
    const startTime = Date.now();
    
    const originalJson = res.json;
    res.json = function(body: any) {
      const duration = Date.now() - startTime;
      const success = body?.success || false;
      
      monitoringService.recordMetric({
        name: 'files.operation_time',
        value: duration,
        unit: 'milliseconds',
        tags: {
          method: req.method,
          success: success.toString(),
        },
      });
      
      if (req.method === 'POST' && success) {
        monitoringService.recordMetric({
          name: 'files.upload_count',
          value: 1,
          unit: 'count',
        });
      }
      
      return originalJson.call(this, body);
    };
  }
  
  next();
};