import request from 'supertest'
import app from '../../app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Meetings API Integration Tests', () => {
  let authToken: string
  let testStudentIds: string[] = []
  let testMeetingId: string

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.meeting.deleteMany({})
    await prisma.student.deleteMany({})
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
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.meeting.deleteMany({})
    await prisma.student.deleteMany({})
    await prisma.user.deleteMany({})
    await prisma.$disconnect()
  })

  describe('POST /api/meetings', () => {
    it('should create meeting successfully', async () => {
      const meetingData = {
        title: 'Parent-Teacher Conference',
        description: 'Discuss student progress and upcoming assignments',
        date: '2024-01-15',
        startTime: '14:00',
        endTime: '15:00',
        participants: testStudentIds,
        participantType: 'students',
        location: 'Room 101',
        meetingType: 'in_person',
        status: 'scheduled',
        notes: 'Bring progress reports'
      }

      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(meetingData)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.title).toBe(meetingData.title)
      expect(response.body.data.participants).toEqual(testStudentIds)
      expect(response.body.data.status).toBe('scheduled')

      testMeetingId = response.body.data.id
    })

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        title: '', // Empty title
        description: 'Test',
        date: 'invalid-date',
        startTime: '25:00', // Invalid time
        endTime: '14:00',
        participants: [],
        participantType: 'students',
        location: 'Room 101',
        meetingType: 'in_person'
      }

      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('should return 401 without authentication', async () => {
      const meetingData = {
        title: 'Test Meeting',
        description: 'Test',
        date: '2024-01-16',
        startTime: '10:00',
        endTime: '11:00',
        participants: ['test'],
        participantType: 'parents',
        location: 'Room 102',
        meetingType: 'virtual'
      }

      const response = await request(app)
        .post('/api/meetings')
        .send(meetingData)

      expect(response.status).toBe(401)
    })

    it('should return 400 for end time before start time', async () => {
      const meetingData = {
        title: 'Invalid Time Meeting',
        description: 'Test',
        date: '2024-01-17',
        startTime: '15:00',
        endTime: '14:00', // End before start
        participants: ['test'],
        participantType: 'parents',
        location: 'Room 103',
        meetingType: 'in_person'
      }

      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(meetingData)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('should return 400 for non-existent students', async () => {
      const meetingData = {
        title: 'Meeting with Non-existent Students',
        description: 'Test',
        date: '2024-01-18',
        startTime: '10:00',
        endTime: '11:00',
        participants: ['123e4567-e89b-12d3-a456-426614174000'], // Non-existent student ID
        participantType: 'students',
        location: 'Room 104',
        meetingType: 'in_person'
      }

      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(meetingData)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('should detect scheduling conflicts', async () => {
      const conflictingMeetingData = {
        title: 'Conflicting Meeting',
        description: 'This should conflict with the first meeting',
        date: '2024-01-15', // Same date as first meeting
        startTime: '14:30', // Overlaps with 14:00-15:00
        endTime: '15:30',
        participants: [testStudentIds[0]], // Same participant
        participantType: 'students',
        location: 'Room 105',
        meetingType: 'in_person'
      }

      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(conflictingMeetingData)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('conflict')
    })
  })

  describe('GET /api/meetings', () => {
    it('should get meetings with pagination', async () => {
      const response = await request(app)
        .get('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body.pagination).toHaveProperty('page')
      expect(response.body.pagination).toHaveProperty('total')
    })

    it('should filter by date', async () => {
      const response = await request(app)
        .get('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ date: '2024-01-15' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.every((meeting: any) => meeting.date === '2024-01-15')).toBe(true)
    })

    it('should filter by meeting type', async () => {
      const response = await request(app)
        .get('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ meetingType: 'in_person' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('should filter by participant', async () => {
      const response = await request(app)
        .get('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ participant: testStudentIds[0] })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })

  describe('GET /api/meetings/:id', () => {
    it('should get meeting by ID', async () => {
      const response = await request(app)
        .get(`/api/meetings/${testMeetingId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(testMeetingId)
      expect(response.body.data).toHaveProperty('title')
      expect(response.body.data).toHaveProperty('participants')
    })

    it('should return 404 for non-existent meeting', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'
      const response = await request(app)
        .get(`/api/meetings/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/meetings/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('PUT /api/meetings/:id', () => {
    it('should update meeting successfully', async () => {
      const updateData = {
        title: 'Updated Parent-Teacher Conference',
        location: 'Room 201',
        notes: 'Updated notes'
      }

      const response = await request(app)
        .put(`/api/meetings/${testMeetingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.title).toBe(updateData.title)
      expect(response.body.data.location).toBe(updateData.location)
      expect(response.body.data.notes).toBe(updateData.notes)
    })

    it('should return 404 for non-existent meeting', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'
      const updateData = { title: 'Updated Title' }

      const response = await request(app)
        .put(`/api/meetings/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/meetings/participant/:participantId', () => {
    it('should get meetings for specific participant', async () => {
      const response = await request(app)
        .get(`/api/meetings/participant/${testStudentIds[0]}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
    })
  })

  describe('GET /api/meetings/range/:startDate/:endDate', () => {
    it('should get meetings in date range', async () => {
      const response = await request(app)
        .get('/api/meetings/range/2024-01-01/2024-01-31')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
    })

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .get('/api/meetings/range/invalid-date/2024-01-31')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('PATCH /api/meetings/:id/cancel', () => {
    it('should cancel meeting successfully', async () => {
      const response = await request(app)
        .patch(`/api/meetings/${testMeetingId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Emergency cancellation' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe('cancelled')
      expect(response.body.data.notes).toContain('Emergency cancellation')
    })

    it('should return 400 for already cancelled meeting', async () => {
      const response = await request(app)
        .patch(`/api/meetings/${testMeetingId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Another reason' })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('PATCH /api/meetings/:id/complete', () => {
    let completableMeetingId: string

    beforeAll(async () => {
      // Create a new meeting that can be completed
      const meetingData = {
        title: 'Completable Meeting',
        description: 'This meeting will be completed',
        date: '2024-01-20',
        startTime: '10:00',
        endTime: '11:00',
        participants: ['parent1'],
        participantType: 'parents',
        location: 'Room 301',
        meetingType: 'virtual'
      }

      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(meetingData)

      completableMeetingId = response.body.data.id
    })

    it('should complete meeting successfully', async () => {
      const response = await request(app)
        .patch(`/api/meetings/${completableMeetingId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Great discussion about student progress' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe('completed')
      expect(response.body.data.notes).toContain('Great discussion')
    })

    it('should return 400 for already completed meeting', async () => {
      const response = await request(app)
        .patch(`/api/meetings/${completableMeetingId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Another note' })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('should return 400 for cancelled meeting', async () => {
      const response = await request(app)
        .patch(`/api/meetings/${testMeetingId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Trying to complete cancelled meeting' })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('DELETE /api/meetings/:id', () => {
    let deletableMeetingId: string

    beforeAll(async () => {
      // Create a new meeting that can be deleted
      const meetingData = {
        title: 'Deletable Meeting',
        description: 'This meeting will be deleted',
        date: '2024-01-25',
        startTime: '16:00',
        endTime: '17:00',
        participants: ['teacher1'],
        participantType: 'teachers',
        location: 'Room 401',
        meetingType: 'in_person'
      }

      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(meetingData)

      deletableMeetingId = response.body.data.id
    })

    it('should delete meeting successfully', async () => {
      const response = await request(app)
        .delete(`/api/meetings/${deletableMeetingId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('deleted successfully')
    })

    it('should return 404 for already deleted meeting', async () => {
      const response = await request(app)
        .delete(`/api/meetings/${deletableMeetingId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })
  })
})