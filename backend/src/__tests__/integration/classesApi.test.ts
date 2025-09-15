import request from 'supertest';
import app from '../../app';

describe('Classes API Integration Tests', () => {

  describe('Authentication', () => {
    it('should return 401 without authentication token', async () => {
      await request(app)
        .get('/api/classes')
        .expect(401);
    });

    it('should return 401 for invalid authentication token', async () => {
      await request(app)
        .get('/api/classes')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Route Structure', () => {
    it('should have classes routes mounted correctly', async () => {
      // Test that the routes exist (will return 401 due to auth, not 404)
      const response = await request(app)
        .get('/api/classes');
      
      expect(response.status).toBe(401); // Auth required, but route exists
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should have class creation route mounted correctly', async () => {
      const response = await request(app)
        .post('/api/classes')
        .send({});
      
      expect(response.status).toBe(401); // Auth required, but route exists
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should have class detail route mounted correctly', async () => {
      const response = await request(app)
        .get('/api/classes/test-id');
      
      expect(response.status).toBe(401); // Auth required, but route exists
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should have enrollment route mounted correctly', async () => {
      const response = await request(app)
        .post('/api/classes/test-id/enroll')
        .send({});
      
      expect(response.status).toBe(401); // Auth required, but route exists
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should have unenrollment route mounted correctly', async () => {
      const response = await request(app)
        .delete('/api/classes/test-id/students/student-id');
      
      expect(response.status).toBe(401); // Auth required, but route exists
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should have class students route mounted correctly', async () => {
      const response = await request(app)
        .get('/api/classes/test-id/students');
      
      expect(response.status).toBe(401); // Auth required, but route exists
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });
});