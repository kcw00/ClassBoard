import { Request, Response, NextFunction } from 'express';
import CacheService from '../services/cacheService';

/**
 * Cache middleware for API responses
 */
export function cacheResponse(
  cacheType: 'classes' | 'students' | 'tests' | 'homework' | 'attendance' | 'schedules' | 'meetings' | 'static',
  keyGenerator?: (req: Request) => string,
  ttlOverride?: number
) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator 
      ? keyGenerator(req) 
      : generateDefaultCacheKey(req);

    // Try to get cached response
    const cachedResponse = CacheService.get(cacheType, cacheKey);
    if (cachedResponse) {
      console.log(`Cache HIT for ${cacheType}:${cacheKey}`);
      return res.json(cachedResponse);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache successful responses
    res.json = function(data: any) {
      // Only cache successful responses (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        CacheService.set(cacheType, cacheKey, data);
        console.log(`Cache SET for ${cacheType}:${cacheKey}`);
      }
      
      // Call original json method
      return originalJson(data);
    };

    return next();
  };
}

/**
 * Generate default cache key from request
 */
function generateDefaultCacheKey(req: Request): string {
  const { path, query } = req;
  const queryString = Object.keys(query).length > 0 
    ? JSON.stringify(query) 
    : '';
  return `${path}:${queryString}`;
}

/**
 * Cache key generators for different endpoints
 */
export const cacheKeyGenerators = {
  /**
   * Generate cache key for paginated class list
   */
  classesList: (req: Request): string => {
    const { page = 1, limit = 10, subject, search } = req.query;
    return CacheService.generatePaginationKey(
      'classes-list',
      Number(page),
      Number(limit),
      { subject, search }
    );
  },

  /**
   * Generate cache key for single class
   */
  classById: (req: Request): string => {
    const { id } = req.params;
    return CacheService.generateEntityKey('class', id, ['enrollments']);
  },

  /**
   * Generate cache key for class students
   */
  classStudents: (req: Request): string => {
    const { id } = req.params;
    return `class-students:${id}`;
  },

  /**
   * Generate cache key for paginated student list
   */
  studentsList: (req: Request): string => {
    const { page = 1, limit = 10, grade, search } = req.query;
    return CacheService.generatePaginationKey(
      'students-list',
      Number(page),
      Number(limit),
      { grade, search }
    );
  },

  /**
   * Generate cache key for single student
   */
  studentById: (req: Request): string => {
    const { id } = req.params;
    return CacheService.generateEntityKey('student', id, ['enrollments']);
  },

  /**
   * Generate cache key for student classes
   */
  studentClasses: (req: Request): string => {
    const { id } = req.params;
    return `student-classes:${id}`;
  },

  /**
   * Generate cache key for class tests
   */
  classTests: (req: Request): string => {
    const { classId } = req.params;
    const { page = 1, limit = 10, testType, search } = req.query;
    return CacheService.generatePaginationKey(
      `class-tests:${classId}`,
      Number(page),
      Number(limit),
      { testType, search }
    );
  },

  /**
   * Generate cache key for test results
   */
  testResults: (req: Request): string => {
    const { id } = req.params;
    return `test-results:${id}`;
  },

  /**
   * Generate cache key for class homework
   */
  classHomework: (req: Request): string => {
    const { classId } = req.params;
    const { page = 1, limit = 10, search, status } = req.query;
    return CacheService.generatePaginationKey(
      `class-homework:${classId}`,
      Number(page),
      Number(limit),
      { search, status }
    );
  },

  /**
   * Generate cache key for homework submissions
   */
  homeworkSubmissions: (req: Request): string => {
    const { id } = req.params;
    return `homework-submissions:${id}`;
  },

  /**
   * Generate cache key for class attendance
   */
  classAttendance: (req: Request): string => {
    const { classId } = req.params;
    const { page = 1, limit = 10, date } = req.query;
    return CacheService.generatePaginationKey(
      `class-attendance:${classId}`,
      Number(page),
      Number(limit),
      { date }
    );
  },

  /**
   * Generate cache key for class schedules
   */
  classSchedules: (req: Request): string => {
    const { classId } = req.params;
    return `class-schedules:${classId}`;
  },

  /**
   * Generate cache key for meetings
   */
  meetings: (req: Request): string => {
    const { page = 1, limit = 10, date, status } = req.query;
    return CacheService.generatePaginationKey(
      'meetings',
      Number(page),
      Number(limit),
      { date, status }
    );
  }
};

/**
 * Middleware to invalidate cache on data modifications
 */
export function invalidateCacheOnModification(
  entityType: 'classes' | 'students' | 'tests' | 'homework' | 'attendance' | 'schedules' | 'meetings',
  getEntityId?: (req: Request) => string
) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only invalidate on non-GET requests
    if (req.method === 'GET') {
      return next();
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to invalidate cache after successful operations
    res.json = function(data: any) {
      // Only invalidate cache for successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entityId = getEntityId ? getEntityId(req) : undefined;
        CacheService.invalidateRelated(entityType, entityId);
        console.log(`Cache INVALIDATED for ${entityType}${entityId ? `:${entityId}` : ''}`);
      }
      
      // Call original json method
      return originalJson(data);
    };

    next();
  };
}

/**
 * Middleware to set cache headers for static content
 */
export function setCacheHeaders(maxAge: number = 300) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET') {
      res.set({
        'Cache-Control': `public, max-age=${maxAge}`,
        'ETag': generateETag(req.originalUrl)
      });
    }
    next();
  };
}

/**
 * Generate ETag for cache validation
 */
function generateETag(url: string): string {
  const hash = require('crypto')
    .createHash('md5')
    .update(url + Date.now())
    .digest('hex');
  return `"${hash}"`;
}

/**
 * Middleware to handle conditional requests (304 Not Modified)
 */
export function handleConditionalRequests() {
  return (req: Request, res: Response, next: NextFunction) => {
    const ifNoneMatch = req.get('If-None-Match');
    const etag = res.get('ETag');

    if (ifNoneMatch && etag && ifNoneMatch === etag) {
      return res.status(304).end();
    }

    next();
  };
}