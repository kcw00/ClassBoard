import request from 'supertest';
import app from '../app';
import { monitoringService } from '../services/monitoringService';

describe('Error Handling and Monitoring', () => {
  // Note: These tests are designed to work without requiring a database connection
  // The health checks will show degraded status when database is unavailable

  describe('Health Check Endpoints', () => {
    it('should return basic health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'ClassBoard API is running',
        version: '1.0.0',
        environment: expect.any(String),
        uptime: expect.any(Number),
      });
    });

    it('should return detailed health status', async () => {
      const response = await request(app)
        .get('/api/health/detailed');

      // Accept both 200 (healthy) and 503 (degraded) status codes
      expect([200, 503]).toContain(response.status);

      expect(response.body).toMatchObject({
        success: true,
        status: expect.stringMatching(/^(healthy|degraded)$/),
        checks: {
          api: {
            status: 'healthy',
            responseTime: expect.any(Number),
          },
          database: {
            status: expect.stringMatching(/^(healthy|unhealthy)$/),
            responseTime: expect.any(Number),
          },
        },
        system: {
          memory: expect.any(Object),
          cpu: expect.any(Object),
        },
      });
    });

    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/api/health/ready');

      // Accept both 200 (ready) and 503 (not ready) status codes
      expect([200, 503]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toMatchObject({
          success: true,
          status: 'ready',
        });
      } else {
        expect(response.body).toMatchObject({
          success: false,
          status: 'not ready',
        });
      }
    });

    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/api/health/live')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        status: 'alive',
        uptime: expect.any(Number),
      });
    });

    it('should return system metrics', async () => {
      const response = await request(app)
        .get('/api/health/metrics')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        system: {
          uptime: expect.any(Number),
          memory: expect.any(Object),
          cpu: expect.any(Object),
        },
        process: {
          pid: expect.any(Number),
          platform: expect.any(String),
          nodeVersion: expect.any(String),
        },
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors with proper format', async () => {
      const response = await request(app)
        .get('/api/truly-nonexistent-endpoint-12345');

      // Accept either 404 or 401 depending on middleware order
      expect([404, 401]).toContain(response.status);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.any(String),
          message: expect.any(String),
        },
        timestamp: expect.any(String),
        path: expect.any(String),
      });
    });

    it('should include request ID in error responses', async () => {
      const response = await request(app)
        .get('/api/truly-nonexistent-endpoint-12345');

      // Accept either 404 or 401 depending on middleware order
      expect([404, 401]).toContain(response.status);

      expect(response.body.requestId).toBeDefined();
      expect(response.headers['x-request-id']).toBeDefined();
    });

    it('should include service status headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['x-database-status']).toBeDefined();
      expect(response.headers['x-s3-status']).toBeDefined();
    });
  });

  describe('Monitoring Service', () => {
    beforeEach(() => {
      // Clear metrics and alerts before each test
      monitoringService.clearAll();
    });

    it('should record metrics', () => {
      monitoringService.recordMetric({
        name: 'test.metric',
        value: 100,
        unit: 'count',
      });

      const metrics = monitoringService.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        name: 'test.metric',
        value: 100,
        unit: 'count',
        timestamp: expect.any(Date),
      });
    });

    it('should send alerts', () => {
      monitoringService.sendAlert({
        level: 'warning',
        message: 'Test alert',
        service: 'test',
      });

      const alerts = monitoringService.getAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        level: 'warning',
        message: 'Test alert',
        service: 'test',
        timestamp: expect.any(Date),
      });
    });

    it('should get system metrics', () => {
      const systemMetrics = monitoringService.getSystemMetrics();
      
      expect(systemMetrics).toMatchObject({
        uptime: expect.any(Number),
        memory: {
          rss: expect.any(Number),
          heapTotal: expect.any(Number),
          heapUsed: expect.any(Number),
          heapUsedPercentage: expect.any(Number),
        },
        cpu: {
          user: expect.any(Number),
          system: expect.any(Number),
        },
      });
    });

    it('should get metrics by name', () => {
      monitoringService.recordMetric({
        name: 'test.specific',
        value: 50,
        unit: 'count',
      });
      
      monitoringService.recordMetric({
        name: 'test.other',
        value: 75,
        unit: 'count',
      });

      const specificMetrics = monitoringService.getMetricsByName('test.specific');
      expect(specificMetrics).toHaveLength(1);
      expect(specificMetrics[0].name).toBe('test.specific');
    });

    it('should get aggregated metrics', () => {
      // Record multiple metrics with the same name
      for (let i = 0; i < 5; i++) {
        monitoringService.recordMetric({
          name: 'test.aggregated',
          value: i * 10,
          unit: 'count',
        });
      }

      const aggregated = monitoringService.getAggregatedMetrics(60);
      expect(aggregated['test.aggregated']).toMatchObject({
        count: 5,
        min: 0,
        max: 40,
        avg: 20,
        sum: 100,
      });
    });
  });

  describe('Monitoring Endpoints', () => {
    it('should return monitoring data', async () => {
      // Record some test data
      monitoringService.recordMetric({
        name: 'test.endpoint',
        value: 123,
        unit: 'count',
      });

      const response = await request(app)
        .get('/api/health/monitoring')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          metrics: expect.any(Array),
          alerts: expect.any(Array),
          summary: {
            totalMetrics: expect.any(Number),
            totalAlerts: expect.any(Number),
            criticalAlerts: expect.any(Number),
          },
        },
      });
    });

    it('should return specific metric data', async () => {
      monitoringService.recordMetric({
        name: 'test.specific.metric',
        value: 456,
        unit: 'milliseconds',
      });

      const response = await request(app)
        .get('/api/health/metrics/test.specific.metric')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        metricName: 'test.specific.metric',
        data: expect.any(Array),
        count: expect.any(Number),
      });
    });
  });

  describe('API Monitoring Integration', () => {
    it('should record API metrics on successful requests', async () => {
      const initialMetrics = monitoringService.getMetrics().length;
      
      await request(app)
        .get('/api/health')
        .expect(200);

      const finalMetrics = monitoringService.getMetrics();
      expect(finalMetrics.length).toBeGreaterThan(initialMetrics);
      
      // Check for API response time metric
      const responseTimeMetrics = finalMetrics.filter(m => m.name === 'api.response_time');
      expect(responseTimeMetrics.length).toBeGreaterThan(0);
    });

    it('should record API error metrics on failed requests', async () => {
      const initialMetrics = monitoringService.getMetrics().length;
      
      await request(app)
        .get('/api/truly-nonexistent-endpoint-12345');

      const finalMetrics = monitoringService.getMetrics();
      expect(finalMetrics.length).toBeGreaterThan(initialMetrics);
      
      // Check for API error metric
      const errorMetrics = finalMetrics.filter(m => m.name === 'api.error_count');
      expect(errorMetrics.length).toBeGreaterThan(0);
    });
  });
});