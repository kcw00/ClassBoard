import request from 'supertest';
import app from '../app';

describe('Server Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      message: 'ClassBoard API is running',
      timestamp: expect.any(String),
      version: '1.0.0',
    });
  });

  it('should return API info on root endpoint', async () => {
    const response = await request(app)
      .get('/api')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      message: 'Welcome to ClassBoard API',
      version: '1.0.0',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth',
        classes: '/api/classes',
        students: '/api/students',
        tests: '/api/tests',
        files: '/api/files',
      },
    });
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app)
      .get('/api/unknown')
      .expect(404);

    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route GET /api/unknown not found',
      },
      timestamp: expect.any(String),
      path: '/api/unknown',
    });
  });
});