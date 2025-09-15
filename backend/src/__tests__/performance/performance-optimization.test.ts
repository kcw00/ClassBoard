import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app';
import CacheService from '../../services/cacheService';
import { 
  createTestContext, 
  createTestData, 
  cleanupTestData, 
  validateApiResponse,
  TestContext,
  TestDataCleanup
} from '../utils/test-helpers';

describe('Performance Optimization Tests', () => {
  let testContext: TestContext;
  let testData: TestDataCleanup;

  beforeAll(async () => {
    testContext = createTestContext('perf-test-user', 'perftest@example.com', 'teacher');
    testData = await createTestData(testContext);
  });

  afterAll(async () => {
    await cleanupTestData(testContext, testData);
  });

  beforeEach(() => {
    CacheService.clearAll();
  });

  describe('Caching Performance', () => {
    it('should cache API responses', async () => {
      // First request - should populate cache
      const response1 = await request(app)
        .get('/api/classes')
        .set('Authorization', `Bearer ${testContext.authToken}`)
        .expect(200);

      validateApiResponse(response1);

      // Second request - should use cache
      const startTime = Date.now();
      const response2 = await request(app)
        .get('/api/classes')
        .set('Authorization', `Bearer ${testContext.authToken}`)
        .expect(200);
      const responseTime = Date.now() - startTime;

      validateApiResponse(response2);
      expect(response2.body.data).toEqual(response1.body.data);
      // Cache should make it faster (though this might be flaky in CI)
      expect(responseTime).toBeLessThan(200);
    });

    it('should provide cache statistics', async () => {
      const response = await request(app)
        .get('/api/performance/cache/stats')
        .set('Authorization', `Bearer ${testContext.authToken}`)
        .expect(200);

      validateApiResponse(response);
      expect(response.body.data).toBeDefined();
    });

    it('should clear cache when requested', async () => {
      // Populate cache
      await request(app)
        .get('/api/classes')
        .set('Authorization', `Bearer ${testContext.authToken}`)
        .expect(200);

      // Clear cache
      await request(app)
        .post('/api/performance/cache/clear')
        .set('Authorization', `Bearer ${testContext.authToken}`)
        .send({ cacheType: 'classes' })
        .expect(200);

      // Verify cache was cleared
      const response = await request(app)
        .get('/api/performance/cache/stats')
        .set('Authorization', `Bearer ${testContext.authToken}`)
        .expect(200);

      expect(response.body.data.classes.size).toBe(0);
    });
  });

  describe('Pagination Optimization', () => {
    it('should handle pagination parameters correctly', async () => {
      const response = await request(app)
        .get('/api/students?page=1&limit=5')
        .set('Authorization', `Bearer ${testContext.authToken}`)
        .expect(200);

      validateApiResponse(response);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should validate pagination parameters', async () => {
      // Test invalid page parameter
      await request(app)
        .get('/api/classes?page=0')
        .set('Authorization', `Bearer ${testContext.authToken}`)
        .expect(400);

      // Test invalid limit parameter
      await request(app)
        .get('/api/classes?limit=1000')
        .set('Authorization', `Bearer ${testContext.authToken}`)
        .expect(400);
    });
  });

  describe('Performance Monitoring', () => {
    it('should provide performance stats endpoint', async () => {
      const response = await request(app)
        .get('/api/performance/stats')
        .set('Authorization', `Bearer ${testContext.authToken}`)
        .expect(200);

      validateApiResponse(response);
      expect(response.body.data.performance).toBeDefined();
      expect(response.body.data.cache).toBeDefined();
      expect(response.body.data.memory).toBeDefined();
    });

    it('should provide health check endpoint', async () => {
      const response = await request(app)
        .get('/api/performance/health')
        .set('Authorization', `Bearer ${testContext.authToken}`)
        .expect(200);

      validateApiResponse(response);
      expect(response.body.data.status).toBeDefined();
      expect(response.body.data.healthScore).toBeDefined();
    });
  });
});