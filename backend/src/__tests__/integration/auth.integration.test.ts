import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../app';

describe('Auth Integration Tests', () => {
    describe('GET /api/auth endpoints', () => {
        it('should return API info', async () => {
            const response = await request(app)
                .get('/api/')
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

        it('should return health check', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                message: 'ClassBoard API is running',
                version: '1.0.0',
            });
            expect(response.body.timestamp).toBeDefined();
        });
    });

    describe('POST /api/auth/login', () => {
        it('should return validation error for missing email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    password: 'TestPassword123',
                })
                .expect(400);

            expect(response.body).toMatchObject({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                },
            });
        });

        it('should return validation error for missing password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                })
                .expect(400);

            expect(response.body).toMatchObject({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                },
            });
        });

        it('should return validation error for invalid email format', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'invalid-email',
                    password: 'TestPassword123',
                })
                .expect(400);

            expect(response.body).toMatchObject({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                },
            });
        });

        it('should return validation error for short password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: '123',
                })
                .expect(400);

            expect(response.body).toMatchObject({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                },
            });
        });
    });

    describe('POST /api/auth/signup', () => {
        it('should return validation error for missing required fields', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: 'test@example.com',
                })
                .expect(400);

            expect(response.body).toMatchObject({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                },
            });
        });

        it('should return validation error for invalid role', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: 'test@example.com',
                    password: 'TestPassword123',
                    name: 'Test User',
                    role: 'invalid-role',
                })
                .expect(400);

            expect(response.body).toMatchObject({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                },
            });
        });

        it('should return validation error for weak password', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: 'test@example.com',
                    password: 'weakpassword',
                    name: 'Test User',
                })
                .expect(400);

            expect(response.body).toMatchObject({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                },
            });
        });
    });

    describe('POST /api/auth/refresh', () => {
        it('should return validation error for missing refresh token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .send({})
                .expect(400);

            expect(response.body).toMatchObject({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                },
            });
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return 401 for missing authorization header', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .expect(401);

            expect(response.body).toEqual({
                success: false,
                error: {
                    code: 'MISSING_TOKEN',
                    message: 'Access token is required',
                },
            });
        });

        it('should return 401 for malformed authorization header', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'InvalidFormat')
                .expect(401);

            expect(response.body).toEqual({
                success: false,
                error: {
                    code: 'MISSING_TOKEN',
                    message: 'Access token is required',
                },
            });
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should return 401 for missing authorization header', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .expect(401);

            expect(response.body).toEqual({
                success: false,
                error: {
                    code: 'MISSING_TOKEN',
                    message: 'Access token is required',
                },
            });
        });
    });
});