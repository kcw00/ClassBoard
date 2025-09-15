import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app';
import { generateTestToken, createTestUser, createTestStudent, createTestClass } from '../setup';
import { setupTestAuth, cleanupTestAuth, generateValidTestToken } from '../utils/test-auth';

describe('End-to-End User Workflows', () => {
  let authToken: string;
  let testUserId: string;
  let testClassId: string;
  let testStudentId: string;

  beforeAll(async () => {
    // Setup test authentication
    setupTestAuth();
    
    // Setup test data
    testUserId = 'e2e-user-id';
    authToken = generateValidTestToken({
      id: testUserId,
      email: 'teacher@example.com',
      name: 'E2E Test Teacher',
      role: 'teacher',
    });
  });

  afterAll(async () => {
    cleanupTestAuth();
  });

  describe('Complete Class Management Workflow', () => {
    it('should complete full class lifecycle: create -> add students -> schedule -> assess -> cleanup', async () => {
      // Step 1: Create a new class
      const createClassResponse = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'E2E Test Class',
          subject: 'Computer Science',
          description: 'End-to-end test class',
          room: 'Lab 101',
          capacity: 25,
          color: '#10B981',
        })
        .expect(201);

      expect(createClassResponse.body.success).toBe(true);
      testClassId = createClassResponse.body.data.id;

      // Step 2: Create and enroll students
      const createStudentResponse = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'E2E Test Student',
          email: 'e2e.student@example.com',
          phone: '555-0123',
          grade: '11th',
          parentContact: 'parent@example.com',
        })
        .expect(201);

      testStudentId = createStudentResponse.body.data.id;

      // Enroll student in class
      await request(app)
        .post(`/api/classes/${testClassId}/enroll`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ studentId: testStudentId })
        .expect(200);

      // Step 3: Create class schedule
      await request(app)
        .post(`/api/classes/${testClassId}/schedules`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dayOfWeek: 1, // Monday
          startTime: '09:00',
          endTime: '10:30',
        })
        .expect(201);

      // Step 4: Create an assessment
      const createTestResponse = await request(app)
        .post(`/api/classes/${testClassId}/tests`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'E2E Quiz',
          description: 'End-to-end test quiz',
          testDate: new Date().toISOString().split('T')[0],
          totalPoints: 100,
          testType: 'quiz',
        })
        .expect(201);

      const testId = createTestResponse.body.data.id;

      // Step 5: Submit test result
      await request(app)
        .post(`/api/tests/${testId}/results`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studentId: testStudentId,
          score: 85,
          maxScore: 100,
          feedback: 'Good work!',
        })
        .expect(201);

      // Step 6: Record attendance
      await request(app)
        .post(`/api/classes/${testClassId}/attendance`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studentId: testStudentId,
          date: new Date().toISOString().split('T')[0],
          status: 'present',
          notes: 'Participated actively',
        })
        .expect(201);

      // Step 7: Verify all data is connected
      const classDetailsResponse = await request(app)
        .get(`/api/classes/${testClassId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(classDetailsResponse.body.data.enrollments).toHaveLength(1);
      expect(classDetailsResponse.body.data.schedules).toHaveLength(1);

      // Step 8: Cleanup - Remove student from class
      await request(app)
        .delete(`/api/classes/${testClassId}/students/${testStudentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Step 9: Delete test data
      await request(app)
        .delete(`/api/tests/${testId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app)
        .delete(`/api/students/${testStudentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app)
        .delete(`/api/classes/${testClassId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Student Assessment Workflow', () => {
    beforeEach(async () => {
      // Create test class and student for each test
      const classResponse = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTestClass({ name: 'Assessment Test Class' }))
        .expect(201);
      testClassId = classResponse.body.data.id;

      const studentResponse = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTestStudent({ name: 'Assessment Test Student' }))
        .expect(201);
      testStudentId = studentResponse.body.data.id;

      await request(app)
        .post(`/api/classes/${testClassId}/enroll`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ studentId: testStudentId })
        .expect(200);
    });

    it('should handle complete assessment workflow with multiple test types', async () => {
      const testTypes = ['quiz', 'exam', 'assignment', 'project'];
      const createdTests: string[] = [];

      // Create different types of assessments
      for (const testType of testTypes) {
        const response = await request(app)
          .post(`/api/classes/${testClassId}/tests`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: `E2E ${testType}`,
            description: `End-to-end ${testType} test`,
            testDate: new Date().toISOString().split('T')[0],
            totalPoints: 100,
            testType,
          })
          .expect(201);

        createdTests.push(response.body.data.id);

        // Submit results for each test
        await request(app)
          .post(`/api/tests/${response.body.data.id}/results`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            studentId: testStudentId,
            score: Math.floor(Math.random() * 30) + 70, // Random score 70-100
            maxScore: 100,
            feedback: `Feedback for ${testType}`,
          })
          .expect(201);
      }

      // Verify all test results exist
      const studentResponse = await request(app)
        .get(`/api/students/${testStudentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(studentResponse.body.data.testResults).toHaveLength(testTypes.length);

      // Cleanup
      for (const testId of createdTests) {
        await request(app)
          .delete(`/api/tests/${testId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      }
    });
  });

  describe('File Management Workflow', () => {
    it('should handle complete file upload and management workflow', async () => {
      // Create a test file buffer
      const testFileContent = Buffer.from('This is a test file content for E2E testing');
      
      // Upload file
      const uploadResponse = await request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFileContent, 'test-file.txt')
        .expect(201);

      const fileId = uploadResponse.body.data.id;
      expect(uploadResponse.body.data.fileName).toBe('test-file.txt');

      // Get file metadata
      const metadataResponse = await request(app)
        .get(`/api/files/${fileId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(metadataResponse.body.data.fileName).toBe('test-file.txt');

      // Delete file
      await request(app)
        .delete(`/api/files/${fileId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify file is deleted
      await request(app)
        .get(`/api/files/${fileId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Meeting and Attendance Workflow', () => {
    beforeEach(async () => {
      const classResponse = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTestClass({ name: 'Meeting Test Class' }))
        .expect(201);
      testClassId = classResponse.body.data.id;

      const studentResponse = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTestStudent({ name: 'Meeting Test Student' }))
        .expect(201);
      testStudentId = studentResponse.body.data.id;

      await request(app)
        .post(`/api/classes/${testClassId}/enroll`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ studentId: testStudentId })
        .expect(200);
    });

    it('should handle complete meeting and attendance workflow', async () => {
      // Create a meeting
      const meetingResponse = await request(app)
        .post(`/api/classes/${testClassId}/meetings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'E2E Test Meeting',
          description: 'End-to-end test meeting',
          meetingDate: new Date().toISOString().split('T')[0],
          startTime: '10:00',
          endTime: '11:00',
          meetingType: 'in-person',
          location: 'Room 101',
        })
        .expect(201);

      const meetingId = meetingResponse.body.data.id;

      // Record attendance for the meeting
      await request(app)
        .post(`/api/meetings/${meetingId}/attendance`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studentId: testStudentId,
          status: 'present',
          notes: 'Active participation',
        })
        .expect(201);

      // Get meeting details with attendance
      const meetingDetailsResponse = await request(app)
        .get(`/api/meetings/${meetingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(meetingDetailsResponse.body.data.attendanceRecords).toHaveLength(1);
      expect(meetingDetailsResponse.body.data.attendanceRecords[0].status).toBe('present');

      // Update attendance
      await request(app)
        .put(`/api/meetings/${meetingId}/attendance/${testStudentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'late',
          notes: 'Arrived 10 minutes late',
        })
        .expect(200);

      // Verify attendance update
      const updatedMeetingResponse = await request(app)
        .get(`/api/meetings/${meetingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(updatedMeetingResponse.body.data.attendanceRecords[0].status).toBe('late');

      // Cleanup
      await request(app)
        .delete(`/api/meetings/${meetingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  afterEach(async () => {
    // Cleanup any remaining test data
    if (testClassId) {
      try {
        await request(app)
          .delete(`/api/classes/${testClassId}`)
          .set('Authorization', `Bearer ${authToken}`);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    if (testStudentId) {
      try {
        await request(app)
          .delete(`/api/students/${testStudentId}`)
          .set('Authorization', `Bearer ${authToken}`);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });
});