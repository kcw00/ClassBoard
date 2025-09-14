import request from 'supertest';
import app from '../app';

describe('Assessment Routes Structure', () => {
  describe('Unauthenticated requests', () => {
    it('should return 401 for test endpoints without authentication', async () => {
      const response = await request(app)
        .get('/api/tests/test-id')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 for homework endpoints without authentication', async () => {
      const response = await request(app)
        .get('/api/homework/homework-id')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 for test results endpoints without authentication', async () => {
      const response = await request(app)
        .post('/api/test-results')
        .send({})
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 for homework submissions endpoints without authentication', async () => {
      const response = await request(app)
        .post('/api/homework-submissions')
        .send({})
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('API Info endpoint', () => {
    it('should include assessment endpoints in API info', async () => {
      const response = await request(app)
        .get('/api/')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.endpoints).toHaveProperty('tests');
      expect(response.body.endpoints).toHaveProperty('homework');
    });
  });

  describe('Health check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('ClassBoard API is running');
    });
  });
});