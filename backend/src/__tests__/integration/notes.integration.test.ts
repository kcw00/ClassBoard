import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../app';
import { generateTestToken } from '../setup';

const prisma = new PrismaClient();

describe('Notes Integration Tests', () => {
  let authToken: string;
  let testClassId: string;
  let testNoteId: string;

  beforeAll(async () => {
    // Generate test token
    authToken = generateTestToken();

    // Create test class
    const testClass = await prisma.class.create({
      data: {
        name: 'Test Math Class',
        subject: 'Mathematics',
        description: 'Test class for notes integration tests',
        room: 'Room 101',
        capacity: 30,
        color: '#FF5733',
        createdDate: '2024-01-15'
      }
    });
    testClassId = testClass.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.classNote.deleteMany({
      where: { classId: testClassId }
    });
    await prisma.class.delete({
      where: { id: testClassId }
    });
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up notes after each test
    await prisma.classNote.deleteMany({
      where: { classId: testClassId }
    });
  });

  describe('POST /api/notes', () => {
    const validNoteData = {
      classId: '',
      date: '2024-01-15',
      content: 'Today we covered basic algebra concepts including linear equations and graphing.',
      topics: ['algebra', 'linear equations', 'graphing'],
      homework: 'Complete exercises 1-10 on page 45',
      objectives: 'Students will understand how to solve linear equations'
    };

    beforeEach(() => {
      validNoteData.classId = testClassId;
    });

    it('should create a new note successfully', async () => {
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validNoteData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        classId: testClassId,
        date: validNoteData.date,
        content: validNoteData.content,
        topics: validNoteData.topics,
        homework: validNoteData.homework,
        objectives: validNoteData.objectives
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.message).toBe('Note created successfully');

      testNoteId = response.body.data.id;
    });

    it('should return 400 for invalid class ID', async () => {
      const invalidData = { ...validNoteData, classId: 'invalid-uuid' };

      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 404 for non-existent class', async () => {
      const invalidData = { ...validNoteData, classId: '123e4567-e89b-12d3-a456-426614174000' };

      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Class not found');
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = { classId: testClassId };

      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .post('/api/notes')
        .send(validNoteData)
        .expect(401);
    });
  });

  describe('GET /api/notes', () => {
    beforeEach(async () => {
      // Create test notes
      await prisma.classNote.createMany({
        data: [
          {
            classId: testClassId,
            date: '2024-01-15',
            content: 'First algebra lesson',
            topics: ['algebra', 'basics'],
            homework: 'Read chapter 1',
            objectives: 'Understand algebra basics',
            createdDate: '2024-01-15',
            updatedDate: '2024-01-15'
          },
          {
            classId: testClassId,
            date: '2024-01-16',
            content: 'Advanced algebra concepts',
            topics: ['algebra', 'advanced'],
            homework: 'Complete exercises 11-20',
            objectives: 'Master advanced concepts',
            createdDate: '2024-01-16',
            updatedDate: '2024-01-16'
          }
        ]
      });
    });

    it('should get all notes with pagination', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 2,
        pages: 1
      });
      expect(response.body.message).toBe('Notes retrieved successfully');
    });

    it('should filter notes by class ID', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ classId: testClassId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((note: any) => note.classId === testClassId)).toBe(true);
    });

    it('should filter notes by date', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ date: '2024-01-15' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].date).toBe('2024-01-15');
    });

    it('should search notes by content', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'advanced' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].content).toContain('Advanced');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/notes')
        .expect(401);
    });
  });

  describe('GET /api/notes/:id', () => {
    beforeEach(async () => {
      const note = await prisma.classNote.create({
        data: {
          classId: testClassId,
          date: '2024-01-15',
          content: 'Test note content',
          topics: ['test'],
          homework: 'Test homework',
          objectives: 'Test objectives',
          createdDate: '2024-01-15',
          updatedDate: '2024-01-15'
        }
      });
      testNoteId = note.id;
    });

    it('should get note by ID', async () => {
      const response = await request(app)
        .get(`/api/notes/${testNoteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testNoteId);
      expect(response.body.data.content).toBe('Test note content');
      expect(response.body.data.class).toBeDefined();
      expect(response.body.message).toBe('Note retrieved successfully');
    });

    it('should return 404 for non-existent note', async () => {
      const response = await request(app)
        .get('/api/notes/123e4567-e89b-12d3-a456-426614174000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Note not found');
    });

    it('should return 400 for invalid note ID', async () => {
      const response = await request(app)
        .get('/api/notes/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get(`/api/notes/${testNoteId}`)
        .expect(401);
    });
  });

  describe('PUT /api/notes/:id', () => {
    beforeEach(async () => {
      const note = await prisma.classNote.create({
        data: {
          classId: testClassId,
          date: '2024-01-15',
          content: 'Original content',
          topics: ['original'],
          homework: 'Original homework',
          objectives: 'Original objectives',
          createdDate: '2024-01-15',
          updatedDate: '2024-01-15'
        }
      });
      testNoteId = note.id;
    });

    it('should update note successfully', async () => {
      const updateData = {
        content: 'Updated content',
        topics: ['updated', 'algebra'],
        homework: 'Updated homework'
      };

      const response = await request(app)
        .put(`/api/notes/${testNoteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe(updateData.content);
      expect(response.body.data.topics).toEqual(updateData.topics);
      expect(response.body.data.homework).toBe(updateData.homework);
      expect(response.body.message).toBe('Note updated successfully');
    });

    it('should return 404 for non-existent note', async () => {
      const response = await request(app)
        .put('/api/notes/123e4567-e89b-12d3-a456-426614174000')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Updated content' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Note not found');
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .put(`/api/notes/${testNoteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .put(`/api/notes/${testNoteId}`)
        .send({ content: 'Updated content' })
        .expect(401);
    });
  });

  describe('DELETE /api/notes/:id', () => {
    beforeEach(async () => {
      const note = await prisma.classNote.create({
        data: {
          classId: testClassId,
          date: '2024-01-15',
          content: 'Note to delete',
          topics: ['test'],
          homework: null,
          objectives: null,
          createdDate: '2024-01-15',
          updatedDate: '2024-01-15'
        }
      });
      testNoteId = note.id;
    });

    it('should delete note successfully', async () => {
      const response = await request(app)
        .delete(`/api/notes/${testNoteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Note deleted successfully');

      // Verify note is deleted
      const deletedNote = await prisma.classNote.findUnique({
        where: { id: testNoteId }
      });
      expect(deletedNote).toBeNull();
    });

    it('should return 404 for non-existent note', async () => {
      const response = await request(app)
        .delete('/api/notes/123e4567-e89b-12d3-a456-426614174000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Note not found');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .delete(`/api/notes/${testNoteId}`)
        .expect(401);
    });
  });

  describe('GET /api/notes/recent', () => {
    beforeEach(async () => {
      // Create test notes with different creation times
      const baseDate = new Date('2024-01-15');
      
      for (let i = 0; i < 5; i++) {
        const createdAt = new Date(baseDate.getTime() + i * 1000 * 60 * 60); // 1 hour apart
        await prisma.classNote.create({
          data: {
            classId: testClassId,
            date: '2024-01-15',
            content: `Note ${i + 1}`,
            topics: [`topic${i + 1}`],
            homework: null,
            objectives: null,
            createdDate: '2024-01-15',
            updatedDate: '2024-01-15',
            createdAt,
            updatedAt: createdAt
          }
        });
      }
    });

    it('should get recent notes with default limit', async () => {
      const response = await request(app)
        .get('/api/notes/recent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.message).toBe('Recent notes retrieved successfully');
      
      // Verify notes are ordered by creation date (newest first)
      const notes = response.body.data;
      for (let i = 0; i < notes.length - 1; i++) {
        expect(new Date(notes[i].createdAt).getTime())
          .toBeGreaterThanOrEqual(new Date(notes[i + 1].createdAt).getTime());
      }
    });

    it('should respect custom limit', async () => {
      const response = await request(app)
        .get('/api/notes/recent')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 3 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/notes/recent')
        .expect(401);
    });
  });
});