import request from 'supertest'
import app from '../../app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Attendance API Integration Tests', () => {
  let authToken: string
  let testClassId: string
  let testStudentIds: string[] = []
  let testAttendanceId: string

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.attendanceEntry.deleteMany({})
    await prisma.attendanceRecord.deleteMany({})
    await prisma.classEnrollment.deleteMany({})
    await prisma.student.deleteMany({})
    await prisma.class.deleteMany({})
    await prisma.user.deleteMany({})

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'teacher@test.com',
        name: 'Test Teacher',
        role: 'TEACHER'
      }
    })

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'teacher@test.com',
        password: 'password123'
      })

    authToken = loginResponse.body.data.token

    // Create test class
    const testClass = await prisma.class.create({
      data: {
        name: 'Test Math Class',
        subject: 'Mathematics',
        description: 'Test class for attendance',
        room: 'Room 101',
        capacity: 30,
        color: '#FF5733',
        createdDate: '2024-01-01'
      }
    })
    testClassId = testClass.id

    // Create test students
    const student1 = await prisma.student.create({
      data: {
        name: 'John Doe',
        email: 'john@test.com',
        phone: '123-456-7890',
        grade: '10',
        parentContact: 'parent1@test.com',
        enrollmentDate: '2024-01-01'
      }
    })

    const student2 = await prisma.student.create({
      data: {
        name: 'Jane Smith',
        email: 'jane@test.com',
        phone: '123-456-7891',
        grade: '10',
        parentContact: 'parent2@test.com',
        enrollmentDate: '2024-01-01'
      }
    })

    testStudentIds = [student1.id, student2.id]

    // Enroll students in class
    await prisma.classEnrollment.createMany({
      data: [
        { classId: testClassId, studentId: student1.id },
        { classId: testClassId, studentId: student2.id }
      ]
    })
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.attendanceEntry.deleteMany({})
    await prisma.attendanceRecord.deleteMany({})
    await prisma.classEnrollment.deleteMany({})
    await prisma.student.deleteMany({})
    await prisma.class.deleteMany({})
    await prisma.user.deleteMany({})
    await prisma.$disconnect()
  })

  describe('POST /api/attendance', () => {
    it('should create attendance record successfully', async () => {
      const attendanceData = {
        classId: testClassId,
        date: '2024-01-15',
        attendanceData: [
          { studentId: testStudentIds[0], status: 'present' },
          { studentId: testStudentIds[1], status: 'absent', notes: 'Sick' }
        ]
      }

      const response = await request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${authToken}`)
        .send(attendanceData)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.classId).toBe(testClassId)
      expect(response.body.data.date).toBe('2024-01-15')
      expect(response.body.data.attendanceData).toHaveLength(2)

      testAttendanceId = response.body.data.id
    })

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        classId: 'invalid-id',
        date: 'invalid-date',
        attendanceData: []
      }

      const response = await request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('should return 401 without authentication', async () => {
      const attendanceData = {
        classId: testClassId,
        date: '2024-01-16',
        attendanceData: [
          { studentId: testStudentIds[0], status: 'present' }
        ]
      }

      const response = await request(app)
        .post('/api/attendance')
        .send(attendanceData)

      expect(response.status).toBe(401)
    })

    it('should return 400 for duplicate attendance record', async () => {
      const attendanceData = {
        classId: testClassId,
        date: '2024-01-15', // Same date as first test
        attendanceData: [
          { studentId: testStudentIds[0], status: 'present' }
        ]
      }

      const response = await request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${authToken}`)
        .send(attendanceData)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/attendance', () => {
    it('should get attendance records with pagination', async () => {
      const response = await request(app)
        .get('/api/attendance')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body.pagination).toHaveProperty('page')
      expect(response.body.pagination).toHaveProperty('total')
    })

    it('should filter by class ID', async () => {
      const response = await request(app)
        .get('/api/attendance')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ classId: testClassId })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.every((record: any) => record.classId === testClassId)).toBe(true)
    })

    it('should filter by date range', async () => {
      const response = await request(app)
        .get('/api/attendance')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          startDate: '2024-01-01', 
          endDate: '2024-01-31' 
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })

  describe('GET /api/attendance/:id', () => {
    it('should get attendance record by ID', async () => {
      const response = await request(app)
        .get(`/api/attendance/${testAttendanceId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(testAttendanceId)
      expect(response.body.data).toHaveProperty('attendanceData')
      expect(response.body.data).toHaveProperty('class')
    })

    it('should return 404 for non-existent record', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'
      const response = await request(app)
        .get(`/api/attendance/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/attendance/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('PUT /api/attendance/:id', () => {
    it('should update attendance record successfully', async () => {
      const updateData = {
        date: '2024-01-16',
        attendanceData: [
          { studentId: testStudentIds[0], status: 'late', notes: 'Traffic' },
          { studentId: testStudentIds[1], status: 'present' }
        ]
      }

      const response = await request(app)
        .put(`/api/attendance/${testAttendanceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.date).toBe('2024-01-16')
      expect(response.body.data.attendanceData).toHaveLength(2)
    })

    it('should return 404 for non-existent record', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'
      const updateData = { date: '2024-01-17' }

      const response = await request(app)
        .put(`/api/attendance/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/attendance/class/:classId', () => {
    it('should get attendance records for specific class', async () => {
      const response = await request(app)
        .get(`/api/attendance/class/${testClassId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.every((record: any) => record.classId === testClassId)).toBe(true)
    })

    it('should return 400 for invalid class ID format', async () => {
      const response = await request(app)
        .get('/api/attendance/class/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/attendance/student/:studentId', () => {
    it('should get attendance records for specific student', async () => {
      const response = await request(app)
        .get(`/api/attendance/student/${testStudentIds[0]}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })

  describe('GET /api/attendance/analytics/summary', () => {
    it('should get attendance analytics', async () => {
      const response = await request(app)
        .get('/api/attendance/analytics/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('totalRecords')
      expect(response.body.data).toHaveProperty('presentCount')
      expect(response.body.data).toHaveProperty('absentCount')
      expect(response.body.data).toHaveProperty('attendanceRate')
    })

    it('should get analytics with student breakdown', async () => {
      const response = await request(app)
        .get('/api/attendance/analytics/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          groupBy: 'student'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('breakdown')
      expect(response.body.data.breakdown).toBeInstanceOf(Array)
    })

    it('should return 400 for missing required dates', async () => {
      const response = await request(app)
        .get('/api/attendance/analytics/summary')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('DELETE /api/attendance/:id', () => {
    it('should delete attendance record successfully', async () => {
      const response = await request(app)
        .delete(`/api/attendance/${testAttendanceId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('deleted successfully')
    })

    it('should return 404 for already deleted record', async () => {
      const response = await request(app)
        .delete(`/api/attendance/${testAttendanceId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })
  })
})