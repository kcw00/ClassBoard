import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getPerformanceStats, clearPerformanceMetrics } from '../middleware/performanceMonitoring';
import CacheService from '../services/cacheService';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * GET /api/performance/stats
 * Get performance statistics
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const performanceStats = getPerformanceStats();
    const cacheStats = CacheService.getStats();
    const memoryUsage = process.memoryUsage();
    
    // Convert memory usage to MB for readability
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    };

    res.json({
      success: true,
      data: {
        performance: performanceStats,
        cache: cacheStats,
        memory: memoryUsageMB,
        uptime: Math.round(process.uptime()),
        nodeVersion: process.version,
        platform: process.platform,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/performance/clear
 * Clear performance metrics (admin only)
 */
router.post('/clear', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a real application, you'd check for admin role here
    // For now, we'll allow any authenticated user
    
    clearPerformanceMetrics();
    
    res.json({
      success: true,
      message: 'Performance metrics cleared successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/performance/cache/stats
 * Get detailed cache statistics
 */
router.get('/cache/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheStats = CacheService.getStats();
    
    res.json({
      success: true,
      data: cacheStats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/performance/cache/clear
 * Clear all caches
 */
router.post('/cache/clear', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cacheType } = req.body;
    
    if (cacheType && ['classes', 'students', 'tests', 'homework', 'attendance', 'schedules', 'meetings', 'static'].includes(cacheType)) {
      CacheService.clear(cacheType as any);
      res.json({
        success: true,
        message: `Cache cleared for ${cacheType}`
      });
    } else if (!cacheType) {
      CacheService.clearAll();
      res.json({
        success: true,
        message: 'All caches cleared successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CACHE_TYPE',
          message: 'Invalid cache type specified'
        }
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/performance/database/stats
 * Get database performance statistics
 */
router.get('/database/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // This would typically come from database monitoring
    // For now, we'll return basic connection info
    const stats = {
      connectionStatus: 'connected',
      activeConnections: 1, // This would come from connection pool
      maxConnections: 10,   // This would come from configuration
      queryCount: 0,        // This would be tracked
      averageQueryTime: 0,  // This would be calculated
      slowQueries: []       // This would be tracked
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/performance/health
 * Get overall system health
 */
router.get('/health', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const performanceStats = getPerformanceStats();
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Calculate health score based on various metrics
    let healthScore = 100;
    
    // Deduct points for high average response time
    if (performanceStats.averageResponseTime > 1000) {
      healthScore -= 20;
    } else if (performanceStats.averageResponseTime > 500) {
      healthScore -= 10;
    }
    
    // Deduct points for high memory usage (> 500MB)
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    if (heapUsedMB > 500) {
      healthScore -= 15;
    } else if (heapUsedMB > 250) {
      healthScore -= 5;
    }
    
    // Deduct points for error rate
    const errorRate = performanceStats.statusCodeDistribution['500'] || 0;
    const totalRequests = performanceStats.totalRequests;
    if (totalRequests > 0) {
      const errorPercentage = (errorRate / totalRequests) * 100;
      if (errorPercentage > 5) {
        healthScore -= 25;
      } else if (errorPercentage > 1) {
        healthScore -= 10;
      }
    }
    
    const status = healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical';
    
    res.json({
      success: true,
      data: {
        status,
        healthScore,
        uptime: Math.round(uptime),
        metrics: {
          averageResponseTime: performanceStats.averageResponseTime,
          totalRequests: performanceStats.totalRequests,
          memoryUsageMB: Math.round(heapUsedMB),
          errorRate: totalRequests > 0 ? Math.round((errorRate / totalRequests) * 100 * 100) / 100 : 0
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;