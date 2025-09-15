import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../app';
import { generateTestToken, runPerformanceTest, measureResponseTime } from '../setup';

describe('API Performance Tests', () => {
  let authToken: string;
  let testClassIds: string[] = [];
  let testStudentIds: string[] = [];

  beforeAll(async () => {
    authToken = generateTestToken('perf-test-user', 'perf@example.com', 'teacher');
    
    // Create test data for performance testing
    console.log('Setting up performance test data...');
    
    // Create multiple classes
    for (let i = 0; i < 10; i++) {
      const response = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `Performance Test Class ${i + 1}`,
          subject: `Subject ${i + 1}`,
          description: `Performance test class ${i + 1}`,
          room: `Room ${i + 1}`,
          capacity: 30,
          color: '#3B82F6',
        });
      
      if (response.status === 201) {
        testClassIds.push(response.body.data.id);
      }
    }

    // Create multiple students
    for (let i = 0; i < 50; i++) {
      const response = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `Performance Test Student ${i + 1}`,
          email: `perf.student${i + 1}@example.com`,
          phone: `555-${String(i).padStart(4, '0')}`,
          grade: '10th',
          parentContact: `parent${i + 1}@example.com`,
        });
      
      if (response.status === 201) {
        testStudentIds.push(response.body.data.id);
      }
    }

    console.log(`Created ${testClassIds.length} classes and ${testStudentIds.length} students for performance testing`);
  });

  afterAll(async () => {
    // Cleanup test data
    console.log('Cleaning up performance test data...');
    
    for (const classId of testClassIds) {
      try {
        await request(app)
          .delete(`/api/classes/${classId}`)
          .set('Authorization', `Bearer ${authToken}`);
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    for (const studentId of testStudentIds) {
      try {
        await request(app)
          .delete(`/api/students/${studentId}`)
          .set('Authorization', `Bearer ${authToken}`);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('Class Management Performance', () => {
    it('should handle GET /api/classes with acceptable response time', async () => {
      const testFn = async () => {
        const response = await request(app)
          .get('/api/classes')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        return response;
      };

      const results = await runPerformanceTest(testFn, 50, 500); // 50 iterations, max 500ms

      console.log(`Classes list performance:
        Average: ${results.averageTime.toFixed(2)}ms
        Max: ${results.maxTime.toFixed(2)}ms
        Min: ${results.minTime.toFixed(2)}ms
        Passed: ${results.passed}`);

      expect(results.passed).toBe(true);
      expect(results.averageTime).toBeLessThan(500);
    });

    it('should handle GET /api/classes/:id with acceptable response time', async () => {
      const classId = testClassIds[0];
      
      const testFn = async () => {
        const response = await request(app)
          .get(`/api/classes/${classId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        return response;
      };

      const results = await runPerformanceTest(testFn, 100, 300); // 100 iterations, max 300ms

      console.log(`Class details performance:
        Average: ${results.averageTime.toFixed(2)}ms
        Max: ${results.maxTime.toFixed(2)}ms
        Min: ${results.minTime.toFixed(2)}ms
        Passed: ${results.passed}`);

      expect(results.passed).toBe(true);
      expect(results.averageTime).toBeLessThan(300);
    });

    it('should handle POST /api/classes with acceptable response time', async () => {
      let createdClassIds: string[] = [];

      const testFn = async () => {
        const response = await request(app)
          .post('/api/classes')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: `Perf Test Class ${Date.now()}`,
            subject: 'Performance Testing',
            description: 'Performance test class',
            room: 'Perf Room',
            capacity: 30,
            color: '#10B981',
          })
          .expect(201);
        
        createdClassIds.push(response.body.data.id);
        return response;
      };

      const results = await runPerformanceTest(testFn, 20, 800); // 20 iterations, max 800ms

      console.log(`Class creation performance:
        Average: ${results.averageTime.toFixed(2)}ms
        Max: ${results.maxTime.toFixed(2)}ms
        Min: ${results.minTime.toFixed(2)}ms
        Passed: ${results.passed}`);

      // Cleanup created classes
      for (const classId of createdClassIds) {
        try {
          await request(app)
            .delete(`/api/classes/${classId}`)
            .set('Authorization', `Bearer ${authToken}`);
        } catch (error) {
          // Ignore cleanup errors
        }
      }

      expect(results.passed).toBe(true);
      expect(results.averageTime).toBeLessThan(800);
    });
  });

  describe('Student Management Performance', () => {
    it('should handle GET /api/students with pagination performance', async () => {
      const testFn = async () => {
        const response = await request(app)
          .get('/api/students?page=1&limit=20')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        return response;
      };

      const results = await runPerformanceTest(testFn, 50, 400); // 50 iterations, max 400ms

      console.log(`Students list performance:
        Average: ${results.averageTime.toFixed(2)}ms
        Max: ${results.maxTime.toFixed(2)}ms
        Min: ${results.minTime.toFixed(2)}ms
        Passed: ${results.passed}`);

      expect(results.passed).toBe(true);
      expect(results.averageTime).toBeLessThan(400);
    });

    it('should handle student search performance', async () => {
      const testFn = async () => {
        const response = await request(app)
          .get('/api/students?search=Performance')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        return response;
      };

      const results = await runPerformanceTest(testFn, 30, 600); // 30 iterations, max 600ms

      console.log(`Student search performance:
        Average: ${results.averageTime.toFixed(2)}ms
        Max: ${results.maxTime.toFixed(2)}ms
        Min: ${results.minTime.toFixed(2)}ms
        Passed: ${results.passed}`);

      expect(results.passed).toBe(true);
      expect(results.averageTime).toBeLessThan(600);
    });
  });

  describe('Assessment Performance', () => {
    it('should handle bulk test result creation performance', async () => {
      // Create a test first
      const testResponse = await request(app)
        .post(`/api/classes/${testClassIds[0]}/tests`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Performance Test Assessment',
          description: 'Performance test assessment',
          testDate: new Date().toISOString().split('T')[0],
          totalPoints: 100,
          testType: 'quiz',
        })
        .expect(201);

      const testId = testResponse.body.data.id;

      // Test bulk result creation
      const testFn = async () => {
        const studentId = testStudentIds[Math.floor(Math.random() * testStudentIds.length)];
        const response = await request(app)
          .post(`/api/tests/${testId}/results`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            studentId,
            score: Math.floor(Math.random() * 30) + 70,
            maxScore: 100,
            feedback: 'Performance test feedback',
          });
        return response;
      };

      const results = await runPerformanceTest(testFn, 20, 1000); // 20 iterations, max 1000ms

      console.log(`Test result creation performance:
        Average: ${results.averageTime.toFixed(2)}ms
        Max: ${results.maxTime.toFixed(2)}ms
        Min: ${results.minTime.toFixed(2)}ms
        Passed: ${results.passed}`);

      // Cleanup
      await request(app)
        .delete(`/api/tests/${testId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(results.passed).toBe(true);
      expect(results.averageTime).toBeLessThan(1000);
    });
  });

  describe('Concurrent Request Performance', () => {
    it('should handle concurrent class requests efficiently', async () => {
      const concurrentRequests = 10;
      const promises: Promise<any>[] = [];

      const startTime = process.hrtime.bigint();

      // Create concurrent requests
      for (let i = 0; i < concurrentRequests; i++) {
        const promise = request(app)
          .get('/api/classes')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        promises.push(promise);
      }

      // Wait for all requests to complete
      const responses = await Promise.all(promises);
      const endTime = process.hrtime.bigint();
      const totalTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

      console.log(`Concurrent requests performance:
        Total time for ${concurrentRequests} requests: ${totalTime.toFixed(2)}ms
        Average per request: ${(totalTime / concurrentRequests).toFixed(2)}ms`);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Total time should be reasonable for concurrent requests
      expect(totalTime).toBeLessThan(5000); // 5 seconds max for 10 concurrent requests
    });

    it('should handle mixed concurrent operations', async () => {
      const operations = [
        () => request(app).get('/api/classes').set('Authorization', `Bearer ${authToken}`),
        () => request(app).get('/api/students').set('Authorization', `Bearer ${authToken}`),
        () => request(app).get(`/api/classes/${testClassIds[0]}`).set('Authorization', `Bearer ${authToken}`),
        () => request(app).get(`/api/students/${testStudentIds[0]}`).set('Authorization', `Bearer ${authToken}`),
        () => request(app).get('/api/health'),
      ];

      const startTime = process.hrtime.bigint();
      
      // Run mixed operations concurrently
      const promises = operations.map(op => op());
      const responses = await Promise.all(promises);
      
      const endTime = process.hrtime.bigint();
      const totalTime = Number(endTime - startTime) / 1000000;

      console.log(`Mixed concurrent operations performance:
        Total time for ${operations.length} mixed requests: ${totalTime.toFixed(2)}ms
        Average per request: ${(totalTime / operations.length).toFixed(2)}ms`);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBeLessThanOrEqual(299);
      });

      expect(totalTime).toBeLessThan(3000); // 3 seconds max for mixed operations
    });
  });

  describe('Memory and Resource Performance', () => {
    it('should not have memory leaks during repeated operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform many operations
      for (let i = 0; i < 100; i++) {
        await request(app)
          .get('/api/classes')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.heapUsed) * 100;

      console.log(`Memory usage:
        Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB
        Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB
        Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB (${memoryIncreasePercent.toFixed(2)}%)`);

      // Memory increase should be reasonable (less than 50% increase)
      expect(memoryIncreasePercent).toBeLessThan(50);
    });
  });
});