import request from 'supertest';
import app from '../../app';

describe('Students API Integration Tests', () => {
  describe('Route Structure Tests', () => {
    it('should return 401 for POST /api/students without authentication', async () => {
      const studentData = {
        name: 'Test Student',
        email: 'test@example.com',
        phone: '+1234567890',
        grade: '10th Grade',
        parentContact: 'Test Parent',
        enrollmentDate: '2024-01-17',
      };

      const response = await request(app)
        .post('/api/students')
        .send(studentData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should return 401 for GET /api/students without authentication', async () => {
      const response = await request(app)
        .get('/api/students');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should return 401 for GET /api/students/search without authentication', async () => {
      const response = await request(app)
        .get('/api/students/search?q=test');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should return 401 for GET /api/students/:id without authentication', async () => {
      const validId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .get(`/api/students/${validId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should return 401 for PUT /api/students/:id without authentication', async () => {
      const validId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = { name: 'Updated Name' };
      
      const response = await request(app)
        .put(`/api/students/${validId}`)
        .send(updateData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should return 401 for DELETE /api/students/:id without authentication', async () => {
      const validId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .delete(`/api/students/${validId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should return 401 for GET /api/students/:id/classes without authentication', async () => {
      const validId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .get(`/api/students/${validId}/classes`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('API Health Check', () => {
    it('should confirm students endpoint is registered in API info', async () => {
      const response = await request(app)
        .get('/api');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.endpoints.students).toBe('/api/students');
    });
  });
});