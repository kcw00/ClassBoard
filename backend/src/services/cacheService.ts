import { LRUCache } from 'lru-cache';

// Cache configuration
interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
}

// Default cache configurations for different data types
const CACHE_CONFIGS = {
  classes: { maxSize: 100, ttl: 5 * 60 * 1000 }, // 5 minutes
  students: { maxSize: 500, ttl: 10 * 60 * 1000 }, // 10 minutes
  tests: { maxSize: 200, ttl: 3 * 60 * 1000 }, // 3 minutes
  homework: { maxSize: 200, ttl: 3 * 60 * 1000 }, // 3 minutes
  attendance: { maxSize: 100, ttl: 2 * 60 * 1000 }, // 2 minutes
  schedules: { maxSize: 100, ttl: 15 * 60 * 1000 }, // 15 minutes
  meetings: { maxSize: 100, ttl: 5 * 60 * 1000 }, // 5 minutes
  static: { maxSize: 50, ttl: 60 * 60 * 1000 }, // 1 hour for static data
};

// Cache instances for different data types
const caches = new Map<string, LRUCache<string, any>>();

// Initialize caches
Object.entries(CACHE_CONFIGS).forEach(([key, config]) => {
  caches.set(key, new LRUCache({
    max: config.maxSize,
    ttl: config.ttl,
    allowStale: false,
    updateAgeOnGet: false,
    updateAgeOnHas: false,
  }));
});

export class CacheService {
  /**
   * Get a value from cache
   */
  static get<T>(cacheType: keyof typeof CACHE_CONFIGS, key: string): T | undefined {
    const cache = caches.get(cacheType);
    if (!cache) {
      console.warn(`Cache type '${cacheType}' not found`);
      return undefined;
    }
    
    const value = cache.get(key);
    if (value !== undefined) {
      console.log(`Cache HIT for ${cacheType}:${key}`);
    }
    return value;
  }

  /**
   * Set a value in cache
   */
  static set<T>(cacheType: keyof typeof CACHE_CONFIGS, key: string, value: T): void {
    const cache = caches.get(cacheType);
    if (!cache) {
      console.warn(`Cache type '${cacheType}' not found`);
      return;
    }
    
    cache.set(key, value);
    console.log(`Cache SET for ${cacheType}:${key}`);
  }

  /**
   * Delete a specific key from cache
   */
  static delete(cacheType: keyof typeof CACHE_CONFIGS, key: string): void {
    const cache = caches.get(cacheType);
    if (!cache) {
      console.warn(`Cache type '${cacheType}' not found`);
      return;
    }
    
    cache.delete(key);
    console.log(`Cache DELETE for ${cacheType}:${key}`);
  }

  /**
   * Clear all entries for a specific cache type
   */
  static clear(cacheType: keyof typeof CACHE_CONFIGS): void {
    const cache = caches.get(cacheType);
    if (!cache) {
      console.warn(`Cache type '${cacheType}' not found`);
      return;
    }
    
    cache.clear();
    console.log(`Cache CLEAR for ${cacheType}`);
  }

  /**
   * Clear all caches
   */
  static clearAll(): void {
    caches.forEach((cache, type) => {
      cache.clear();
      console.log(`Cache CLEAR for ${type}`);
    });
  }

  /**
   * Get cache statistics
   */
  static getStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    caches.forEach((cache, type) => {
      stats[type] = {
        size: cache.size,
        maxSize: cache.max,
        calculatedSize: cache.calculatedSize,
        ttl: CACHE_CONFIGS[type as keyof typeof CACHE_CONFIGS].ttl,
      };
    });
    
    return stats;
  }

  /**
   * Generate cache key for paginated queries
   */
  static generatePaginationKey(baseKey: string, page: number, limit: number, filters?: Record<string, any>): string {
    const filterStr = filters ? JSON.stringify(filters) : '';
    return `${baseKey}:page:${page}:limit:${limit}:filters:${filterStr}`;
  }

  /**
   * Generate cache key for entity with relations
   */
  static generateEntityKey(entityType: string, id: string, includeRelations?: string[]): string {
    const relationsStr = includeRelations ? includeRelations.sort().join(',') : '';
    return `${entityType}:${id}:relations:${relationsStr}`;
  }

  /**
   * Invalidate related cache entries when an entity is modified
   */
  static invalidateRelated(entityType: string, entityId?: string): void {
    const cache = caches.get(entityType as keyof typeof CACHE_CONFIGS);
    if (!cache) return;

    // If specific entity ID provided, invalidate specific entries
    if (entityId) {
      // Find and delete all keys that contain this entity ID
      const keysToDelete: string[] = [];
      cache.forEach((value, key) => {
        if (key.includes(entityId)) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => cache.delete(key));
      console.log(`Cache INVALIDATE related entries for ${entityType}:${entityId}`);
    } else {
      // Clear entire cache for this entity type
      this.clear(entityType as keyof typeof CACHE_CONFIGS);
    }

    // Also invalidate related entity caches based on relationships
    this.invalidateRelatedEntities(entityType, entityId);
  }

  /**
   * Invalidate caches for related entities based on relationships
   */
  private static invalidateRelatedEntities(entityType: string, entityId?: string): void {
    switch (entityType) {
      case 'classes':
        // When a class changes, invalidate student and test caches
        this.clear('students');
        this.clear('tests');
        this.clear('homework');
        this.clear('attendance');
        this.clear('schedules');
        break;
      
      case 'students':
        // When a student changes, invalidate class and test result caches
        this.clear('classes');
        this.clear('tests');
        this.clear('homework');
        this.clear('attendance');
        break;
      
      case 'tests':
        // When a test changes, invalidate related homework and class caches
        this.clear('homework');
        break;
      
      case 'homework':
        // When homework changes, invalidate test caches
        this.clear('tests');
        break;
      
      case 'attendance':
        // Attendance changes don't typically affect other entities
        break;
      
      case 'schedules':
        // Schedule changes might affect attendance
        this.clear('attendance');
        break;
      
      case 'meetings':
        // Meeting changes might affect attendance
        this.clear('attendance');
        break;
    }
  }

  /**
   * Middleware function to cache API responses
   */
  static cacheMiddleware(cacheType: keyof typeof CACHE_CONFIGS, keyGenerator: (req: any) => string) {
    return (req: any, res: any, next: any) => {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }

      const cacheKey = keyGenerator(req);
      const cachedData = this.get(cacheType, cacheKey);

      if (cachedData) {
        // Return cached data
        return res.json(cachedData);
      }

      // Store original json method
      const originalJson = res.json;

      // Override json method to cache the response
      res.json = function(data: any) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          CacheService.set(cacheType, cacheKey, data);
        }
        
        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    };
  }
}

export default CacheService;