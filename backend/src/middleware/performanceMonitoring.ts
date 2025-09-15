import { Request, Response, NextFunction } from 'express';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
}

// In-memory storage for performance metrics (in production, use a proper database or monitoring service)
const performanceMetrics: PerformanceMetrics[] = [];
const MAX_METRICS_STORED = 1000;

/**
 * Middleware to track API performance metrics
 */
export function trackPerformance() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Store original end method
    const originalEnd = res.end.bind(res);
    
    // Override end method to capture response time
    res.end = function(chunk?: any, encoding?: BufferEncoding, cb?: () => void) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Store performance metric
      const metric: PerformanceMetrics = {
        endpoint: req.route?.path || req.path,
        method: req.method,
        responseTime,
        statusCode: res.statusCode,
        timestamp: new Date(),
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress
      };
      
      addPerformanceMetric(metric);
      
      // Log slow requests (> 1 second)
      if (responseTime > 1000) {
        console.warn(`Slow request detected: ${req.method} ${req.path} - ${responseTime}ms`);
      }
      
      // Add performance headers
      res.set('X-Response-Time', `${responseTime}ms`);
      
      // Call original end method
      return originalEnd.call(this, chunk, encoding, cb);
    };
    
    next();
  };
}

/**
 * Add performance metric to storage
 */
function addPerformanceMetric(metric: PerformanceMetrics): void {
  performanceMetrics.push(metric);
  
  // Keep only the last MAX_METRICS_STORED metrics
  if (performanceMetrics.length > MAX_METRICS_STORED) {
    performanceMetrics.shift();
  }
}

/**
 * Get performance statistics
 */
export function getPerformanceStats(): {
  totalRequests: number;
  averageResponseTime: number;
  slowestEndpoints: Array<{ endpoint: string; method: string; avgResponseTime: number; requestCount: number }>;
  statusCodeDistribution: Record<string, number>;
  recentMetrics: PerformanceMetrics[];
} {
  if (performanceMetrics.length === 0) {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      slowestEndpoints: [],
      statusCodeDistribution: {},
      recentMetrics: []
    };
  }

  // Calculate average response time
  const totalResponseTime = performanceMetrics.reduce((sum, metric) => sum + metric.responseTime, 0);
  const averageResponseTime = Math.round(totalResponseTime / performanceMetrics.length);

  // Group by endpoint and method
  const endpointStats = new Map<string, { totalTime: number; count: number }>();
  const statusCodeDistribution: Record<string, number> = {};

  performanceMetrics.forEach(metric => {
    const key = `${metric.method} ${metric.endpoint}`;
    const existing = endpointStats.get(key) || { totalTime: 0, count: 0 };
    endpointStats.set(key, {
      totalTime: existing.totalTime + metric.responseTime,
      count: existing.count + 1
    });

    // Count status codes
    const statusCode = metric.statusCode.toString();
    statusCodeDistribution[statusCode] = (statusCodeDistribution[statusCode] || 0) + 1;
  });

  // Calculate slowest endpoints
  const slowestEndpoints = Array.from(endpointStats.entries())
    .map(([key, stats]) => {
      const [method, endpoint] = key.split(' ', 2);
      return {
        endpoint,
        method,
        avgResponseTime: Math.round(stats.totalTime / stats.count),
        requestCount: stats.count
      };
    })
    .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
    .slice(0, 10);

  // Get recent metrics (last 50)
  const recentMetrics = performanceMetrics.slice(-50);

  return {
    totalRequests: performanceMetrics.length,
    averageResponseTime,
    slowestEndpoints,
    statusCodeDistribution,
    recentMetrics
  };
}

/**
 * Middleware to add database query performance tracking
 */
export function trackDatabasePerformance() {
  return (req: Request, res: Response, next: NextFunction) => {
    const queryStartTimes = new Map<string, number>();
    
    // Store query start time in request context
    req.dbQueryStart = (queryId: string) => {
      queryStartTimes.set(queryId, Date.now());
    };
    
    // Store query end time and log if slow
    req.dbQueryEnd = (queryId: string, query?: string) => {
      const startTime = queryStartTimes.get(queryId);
      if (startTime) {
        const duration = Date.now() - startTime;
        queryStartTimes.delete(queryId);
        
        // Log slow queries (> 500ms)
        if (duration > 500) {
          console.warn(`Slow database query detected: ${duration}ms`, {
            queryId,
            query: query?.substring(0, 100) + (query && query.length > 100 ? '...' : ''),
            endpoint: req.path,
            method: req.method
          });
        }
      }
    };
    
    next();
  };
}

/**
 * Middleware to track memory usage
 */
export function trackMemoryUsage() {
  return (req: Request, res: Response, next: NextFunction) => {
    const memoryBefore = process.memoryUsage();
    
    // Store original end method
    const originalEnd = res.end.bind(res);
    
    // Override end method to track memory usage
    res.end = function(chunk?: any, encoding?: BufferEncoding, cb?: () => void) {
      const memoryAfter = process.memoryUsage();
      const memoryDelta = {
        rss: memoryAfter.rss - memoryBefore.rss,
        heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
        heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
        external: memoryAfter.external - memoryBefore.external
      };
      
      // Log significant memory increases (> 10MB)
      if (memoryDelta.heapUsed > 10 * 1024 * 1024) {
        console.warn(`High memory usage detected: +${Math.round(memoryDelta.heapUsed / 1024 / 1024)}MB`, {
          endpoint: req.path,
          method: req.method,
          memoryDelta
        });
      }
      
      // Add memory usage headers in development
      if (process.env.NODE_ENV === 'development') {
        res.set('X-Memory-Delta-MB', Math.round(memoryDelta.heapUsed / 1024 / 1024).toString());
      }
      
      // Call original end method
      return originalEnd.call(this, chunk, encoding, cb);
    };
    
    next();
  };
}

/**
 * Clear performance metrics (useful for testing or periodic cleanup)
 */
export function clearPerformanceMetrics(): void {
  performanceMetrics.length = 0;
}

// Extend Request interface to include database query tracking methods
declare global {
  namespace Express {
    interface Request {
      dbQueryStart?: (queryId: string) => void;
      dbQueryEnd?: (queryId: string, query?: string) => void;
    }
  }
}