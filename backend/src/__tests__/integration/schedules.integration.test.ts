import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../app';
import { generateTestToken } from '../setup';

const prisma = new PrismaClient();

describe('Schedule API Integration Tests', () => {
  let authToken: string;
  let testClassId: string;
  let testScheduleId: string;
  let testExceptionId: string;

  beforeAll(async () => {
    // Generate auth token for testing
    authToken = generateTestToken();

    // Create a test class
    const testClass = await prisma.class.create({
      data: {
        name: 'Test Schedule Class',
        subject: 'Mathematics',
        description: 'Test class for schedule integration tests',
        room: 'Room 101',
        capacity: 30,
        color: '#FF5733',
        createdDate: '2024-12-01',
      },
    });
    testClassId = testClass.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.scheduleException.deleteMany({
      where: {
        schedule: {
          classId: testClassId,
        },
      },
    });
    await prisma.schedule.deleteMany({
      where: { classId: testClassId },
    });
    await prisma.class.delete({
      where: { id: testClassId },
    });
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up schedules and exceptions after each test
    await prisma.scheduleException.deleteMany({
      where: {
        schedule: {
          classId: testClassId,
        },
      },
    });
    await prisma.schedule.deleteMany({
      where: { classId: testClassId },
    });
  });

  describe('POST /api/classes/:classId/schedules', () => {
    it('should create a new schedule successfully', async () => {
      const scheduleData = {
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '10:00',
      };

      const response = await request(app)
        .post(`/api/classes/${testClassId}/schedules`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(scheduleData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Schedule created successfully',
        data: {
          id: expect.any(String),
          classId: testClassId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:00',
        },
      });

      testScheduleId = response.body.data.id;
    });

    it('should return 400 for invalid schedule data', async () => {
      const invalidData = {
        dayOfWeek: 8, // Invalid day
        startTime: '25:00', // Invalid time
        endTime: '08:00', // End before start
      };

      const response = await request(app)
        .post(`/api/classes/${testClassId}/schedules`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
        },
      });
    });

    it('should return 404 for non-existent class', async () => {
      const scheduleData = {
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:00',
      };

      await request(app)
        .post('/api/classes/non-existent-id/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send(scheduleData)
        .expect(400); // UUID validation error
    });

    it('should return 409 for conflicting schedules', async () => {
      // Create first schedule
      const scheduleData1 = {
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:00',
      };

      await request(app)
        .post(`/api/classes/${testClassId}/schedules`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(scheduleData1)
        .expect(201);

      // Try to create overlapping schedule
      const scheduleData2 = {
        dayOfWeek: 1,
        startTime: '09:30',
        endTime: '10:30',
      };

      const response = await request(app)
        .post(`/api/classes/${testClassId}/schedules`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(scheduleData2)
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'CONFLICT_ERROR',
          message: expect.stringContaining('Schedule conflicts detected'),
        },
      });
    });

    it('should return 401 without authentication', async () => {
      const scheduleData = {
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:00',
      };

      await request(app)
        .post(`/api/classes/${testClassId}/schedules`)
        .send(scheduleData)
        .expect(401);
    });
  });

  describe('GET /api/classes/:classId/schedules', () => {
    beforeEach(async () => {
      // Create test schedules
      const schedule1 = await prisma.schedule.create({
        data: {
          classId: testClassId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:00',
        },
      });

      const schedule2 = await prisma.schedule.create({
        data: {
          classId: testClassId,
          dayOfWeek: 3,
          startTime: '14:00',
          endTime: '15:00',
        },
      });

      testScheduleId = schedule1.id;

      // Create an exception for schedule2
      await prisma.scheduleException.create({
        data: {
          scheduleId: schedule2.id,
          date: '2024-12-25',
          startTime: '15:00',
          endTime: '16:00',
          cancelled: false,
          createdDate: '2024-12-01',
        },
      });
    });

    it('should return all schedules for a class', async () => {
      const response = await request(app)
        .get(`/api/classes/${testClassId}/schedules`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            classId: testClassId,
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '10:00',
            exceptions: [],
          }),
          expect.objectContaining({
            id: expect.any(String),
            classId: testClassId,
            dayOfWeek: 3,
            startTime: '14:00',
            endTime: '15:00',
            exceptions: expect.arrayContaining([
              expect.objectContaining({
                date: '2024-12-25',
                startTime: '15:00',
                endTime: '16:00',
                cancelled: false,
              }),
            ]),
          }),
        ]),
      });

      expect(response.body.data).toHaveLength(2);
    });

    it('should return 404 for non-existent class', async () => {
      const fakeClassId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .get(`/api/classes/${fakeClassId}/schedules`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND_ERROR',
          message: 'Class not found',
        },
      });
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get(`/api/classes/${testClassId}/schedules`)
        .expect(401);
    });
  });

  describe('GET /api/schedules/:id', () => {
    beforeEach(async () => {
      const schedule = await prisma.schedule.create({
        data: {
          classId: testClassId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:00',
        },
      });
      testScheduleId = schedule.id;

      // Create an exception
      const exception = await prisma.scheduleException.create({
        data: {
          scheduleId: testScheduleId,
          date: '2024-12-25',
          startTime: '10:00',
          endTime: '11:00',
          cancelled: false,
          createdDate: '2024-12-01',
        },
      });
      testExceptionId = exception.id;
    });

    it('should return a schedule with exceptions', async () => {
      const response = await request(app)
        .get(`/api/schedules/${testScheduleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: testScheduleId,
          classId: testClassId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:00',
          exceptions: [
            {
              id: testExceptionId,
              scheduleId: testScheduleId,
              date: '2024-12-25',
              startTime: '10:00',
              endTime: '11:00',
              cancelled: false,
              createdDate: '2024-12-01',
            },
          ],
        },
      });
    });

    it('should return 404 for non-existent schedule', async () => {
      const fakeScheduleId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .get(`/api/schedules/${fakeScheduleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND_ERROR',
          message: 'Schedule not found',
        },
      });
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get(`/api/schedules/${testScheduleId}`)
        .expect(401);
    });
  });

  describe('PUT /api/schedules/:id', () => {
    beforeEach(async () => {
      const schedule = await prisma.schedule.create({
        data: {
          classId: testClassId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:00',
        },
      });
      testScheduleId = schedule.id;
    });

    it('should update a schedule successfully', async () => {
      const updateData = {
        startTime: '09:30',
        endTime: '10:30',
      };

      const response = await request(app)
        .put(`/api/schedules/${testScheduleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Schedule updated successfully',
        data: {
          id: testScheduleId,
          classId: testClassId,
          dayOfWeek: 1,
          startTime: '09:30',
          endTime: '10:30',
        },
      });
    });

    it('should return 400 for invalid update data', async () => {
      const invalidData = {
        startTime: '10:00',
        endTime: '09:00', // End before start
      };

      const response = await request(app)
        .put(`/api/schedules/${testScheduleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
        },
      });
    });

    it('should return 404 for non-existent schedule', async () => {
      const fakeScheduleId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = {
        startTime: '09:30',
        endTime: '10:30',
      };

      const response = await request(app)
        .put(`/api/schedules/${fakeScheduleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND_ERROR',
          message: 'Schedule not found',
        },
      });
    });

    it('should return 401 without authentication', async () => {
      const updateData = {
        startTime: '09:30',
        endTime: '10:30',
      };

      await request(app)
        .put(`/api/schedules/${testScheduleId}`)
        .send(updateData)
        .expect(401);
    });
  });

  describe('DELETE /api/schedules/:id', () => {
    beforeEach(async () => {
      const schedule = await prisma.schedule.create({
        data: {
          classId: testClassId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:00',
        },
      });
      testScheduleId = schedule.id;
    });

    it('should delete a schedule successfully', async () => {
      const response = await request(app)
        .delete(`/api/schedules/${testScheduleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Schedule deleted successfully',
      });

      // Verify schedule is deleted
      const deletedSchedule = await prisma.schedule.findUnique({
        where: { id: testScheduleId },
      });
      expect(deletedSchedule).toBeNull();
    });

    it('should return 404 for non-existent schedule', async () => {
      const fakeScheduleId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .delete(`/api/schedules/${fakeScheduleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND_ERROR',
          message: 'Schedule not found',
        },
      });
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .delete(`/api/schedules/${testScheduleId}`)
        .expect(401);
    });
  });

  describe('POST /api/schedules/:id/exceptions', () => {
    beforeEach(async () => {
      const schedule = await prisma.schedule.create({
        data: {
          classId: testClassId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:00',
        },
      });
      testScheduleId = schedule.id;
    });

    it('should create a schedule exception successfully', async () => {
      const exceptionData = {
        date: '2024-12-25',
        startTime: '10:00',
        endTime: '11:00',
        cancelled: false,
      };

      const response = await request(app)
        .post(`/api/schedules/${testScheduleId}/exceptions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(exceptionData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Schedule exception created successfully',
        data: {
          id: expect.any(String),
          scheduleId: testScheduleId,
          date: '2024-12-25',
          startTime: '10:00',
          endTime: '11:00',
          cancelled: false,
          createdDate: expect.any(String),
        },
      });

      testExceptionId = response.body.data.id;
    });

    it('should return 400 for invalid exception data', async () => {
      const invalidData = {
        date: '2024-13-45', // Invalid date
        startTime: '25:00', // Invalid time
        endTime: '08:00', // End before start
      };

      const response = await request(app)
        .post(`/api/schedules/${testScheduleId}/exceptions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
        },
      });
    });

    it('should return 404 for non-existent schedule', async () => {
      const fakeScheduleId = '123e4567-e89b-12d3-a456-426614174000';
      const exceptionData = {
        date: '2024-12-25',
        startTime: '10:00',
        endTime: '11:00',
        cancelled: false,
      };

      const response = await request(app)
        .post(`/api/schedules/${fakeScheduleId}/exceptions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(exceptionData)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND_ERROR',
          message: 'Schedule not found',
        },
      });
    });

    it('should return 409 for duplicate exception date', async () => {
      const exceptionData = {
        date: '2024-12-25',
        startTime: '10:00',
        endTime: '11:00',
        cancelled: false,
      };

      // Create first exception
      await request(app)
        .post(`/api/schedules/${testScheduleId}/exceptions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(exceptionData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post(`/api/schedules/${testScheduleId}/exceptions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(exceptionData)
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'CONFLICT_ERROR',
          message: 'Schedule exception already exists for this date',
        },
      });
    });

    it('should return 401 without authentication', async () => {
      const exceptionData = {
        date: '2024-12-25',
        startTime: '10:00',
        endTime: '11:00',
        cancelled: false,
      };

      await request(app)
        .post(`/api/schedules/${testScheduleId}/exceptions`)
        .send(exceptionData)
        .expect(401);
    });
  });

  describe('GET /api/schedules/:id/exceptions', () => {
    beforeEach(async () => {
      const schedule = await prisma.schedule.create({
        data: {
          classId: testClassId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:00',
        },
      });
      testScheduleId = schedule.id;

      // Create test exceptions
      await prisma.scheduleException.createMany({
        data: [
          {
            scheduleId: testScheduleId,
            date: '2024-12-25',
            startTime: '10:00',
            endTime: '11:00',
            cancelled: false,
            createdDate: '2024-12-01',
          },
          {
            scheduleId: testScheduleId,
            date: '2024-12-26',
            startTime: '09:00',
            endTime: '10:00',
            cancelled: true,
            createdDate: '2024-12-01',
          },
        ],
      });
    });

    it('should return all exceptions for a schedule', async () => {
      const response = await request(app)
        .get(`/api/schedules/${testScheduleId}/exceptions`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            scheduleId: testScheduleId,
            date: '2024-12-25',
            startTime: '10:00',
            endTime: '11:00',
            cancelled: false,
          }),
          expect.objectContaining({
            scheduleId: testScheduleId,
            date: '2024-12-26',
            startTime: '09:00',
            endTime: '10:00',
            cancelled: true,
          }),
        ]),
      });

      expect(response.body.data).toHaveLength(2);
    });

    it('should return 404 for non-existent schedule', async () => {
      const fakeScheduleId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .get(`/api/schedules/${fakeScheduleId}/exceptions`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND_ERROR',
          message: 'Schedule not found',
        },
      });
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get(`/api/schedules/${testScheduleId}/exceptions`)
        .expect(401);
    });
  });

  describe('PUT /api/exceptions/:exceptionId', () => {
    beforeEach(async () => {
      const schedule = await prisma.schedule.create({
        data: {
          classId: testClassId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:00',
        },
      });
      testScheduleId = schedule.id;

      const exception = await prisma.scheduleException.create({
        data: {
          scheduleId: testScheduleId,
          date: '2024-12-25',
          startTime: '10:00',
          endTime: '11:00',
          cancelled: false,
          createdDate: '2024-12-01',
        },
      });
      testExceptionId = exception.id;
    });

    it('should update a schedule exception successfully', async () => {
      const updateData = {
        startTime: '10:30',
        endTime: '11:30',
        cancelled: true,
      };

      const response = await request(app)
        .put(`/api/exceptions/${testExceptionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Schedule exception updated successfully',
        data: {
          id: testExceptionId,
          scheduleId: testScheduleId,
          date: '2024-12-25',
          startTime: '10:30',
          endTime: '11:30',
          cancelled: true,
        },
      });
    });

    it('should return 400 for invalid update data', async () => {
      const invalidData = {
        startTime: '11:00',
        endTime: '10:00', // End before start
      };

      const response = await request(app)
        .put(`/api/exceptions/${testExceptionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
        },
      });
    });

    it('should return 404 for non-existent exception', async () => {
      const fakeExceptionId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = {
        startTime: '10:30',
        endTime: '11:30',
      };

      const response = await request(app)
        .put(`/api/exceptions/${fakeExceptionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND_ERROR',
          message: 'Schedule exception not found',
        },
      });
    });

    it('should return 401 without authentication', async () => {
      const updateData = {
        startTime: '10:30',
        endTime: '11:30',
      };

      await request(app)
        .put(`/api/exceptions/${testExceptionId}`)
        .send(updateData)
        .expect(401);
    });
  });

  describe('DELETE /api/exceptions/:exceptionId', () => {
    beforeEach(async () => {
      const schedule = await prisma.schedule.create({
        data: {
          classId: testClassId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:00',
        },
      });
      testScheduleId = schedule.id;

      const exception = await prisma.scheduleException.create({
        data: {
          scheduleId: testScheduleId,
          date: '2024-12-25',
          startTime: '10:00',
          endTime: '11:00',
          cancelled: false,
          createdDate: '2024-12-01',
        },
      });
      testExceptionId = exception.id;
    });

    it('should delete a schedule exception successfully', async () => {
      const response = await request(app)
        .delete(`/api/exceptions/${testExceptionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Schedule exception deleted successfully',
      });

      // Verify exception is deleted
      const deletedException = await prisma.scheduleException.findUnique({
        where: { id: testExceptionId },
      });
      expect(deletedException).toBeNull();
    });

    it('should return 404 for non-existent exception', async () => {
      const fakeExceptionId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .delete(`/api/exceptions/${fakeExceptionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND_ERROR',
          message: 'Schedule exception not found',
        },
      });
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .delete(`/api/exceptions/${testExceptionId}`)
        .expect(401);
    });
  });
});