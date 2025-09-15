// Mock Prisma Client first
const mockPrisma = {
  class: {
    findUnique: jest.fn(),
  },
  classNote: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createMany: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));

import { PrismaClient } from '@prisma/client';
import { noteService } from '../services/noteService';
import { NotFoundError, DatabaseError } from '../utils/errors';

describe('NoteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNote', () => {
    const mockNoteData = {
      classId: 'class-123',
      date: '2024-01-15',
      content: 'Today we covered algebra basics',
      topics: ['algebra', 'equations'],
      homework: 'Complete exercises 1-10',
      objectives: 'Understand basic algebraic concepts'
    };

    const mockClass = {
      id: 'class-123',
      name: 'Math 101',
      subject: 'Mathematics'
    };

    const mockCreatedNote = {
      id: 'note-123',
      ...mockNoteData,
      createdDate: '2024-01-15',
      updatedDate: '2024-01-15',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create a note successfully', async () => {
      mockPrisma.class.findUnique = jest.fn().mockResolvedValue(mockClass);
      mockPrisma.classNote.create = jest.fn().mockResolvedValue(mockCreatedNote);

      const result = await noteService.createNote(mockNoteData);

      expect(mockPrisma.class.findUnique).toHaveBeenCalledWith({
        where: { id: mockNoteData.classId }
      });
      expect(mockPrisma.classNote.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          classId: mockNoteData.classId,
          date: mockNoteData.date,
          content: mockNoteData.content,
          topics: mockNoteData.topics,
          homework: mockNoteData.homework,
          objectives: mockNoteData.objectives
        })
      });
      expect(result).toEqual(mockCreatedNote);
    });

    it('should throw error if class does not exist', async () => {
      mockPrisma.class.findUnique = jest.fn().mockResolvedValue(null);

      await expect(noteService.createNote(mockNoteData))
        .rejects.toThrow(new NotFoundError('Class not found'));
    });

    it('should handle database errors', async () => {
      mockPrisma.class.findUnique = jest.fn().mockResolvedValue(mockClass);
      mockPrisma.classNote.create = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(noteService.createNote(mockNoteData))
        .rejects.toThrow(new DatabaseError('Failed to create note'));
    });
  });

  describe('getNoteById', () => {
    const mockNote = {
      id: 'note-123',
      classId: 'class-123',
      date: '2024-01-15',
      content: 'Today we covered algebra basics',
      topics: ['algebra'],
      homework: 'Complete exercises 1-10',
      objectives: 'Understand basic algebraic concepts',
      createdDate: '2024-01-15',
      updatedDate: '2024-01-15',
      createdAt: new Date(),
      updatedAt: new Date(),
      class: {
        id: 'class-123',
        name: 'Math 101',
        subject: 'Mathematics'
      }
    };

    it('should return note by id', async () => {
      mockPrisma.classNote.findUnique = jest.fn().mockResolvedValue(mockNote);

      const result = await noteService.getNoteById('note-123');

      expect(mockPrisma.classNote.findUnique).toHaveBeenCalledWith({
        where: { id: 'note-123' },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              subject: true
            }
          }
        }
      });
      expect(result).toEqual(mockNote);
    });

    it('should return null if note not found', async () => {
      mockPrisma.classNote.findUnique = jest.fn().mockResolvedValue(null);

      const result = await noteService.getNoteById('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockPrisma.classNote.findUnique = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(noteService.getNoteById('note-123'))
        .rejects.toThrow(new DatabaseError('Failed to fetch note'));
    });
  });

  describe('getNotes', () => {
    const mockNotes = [
      {
        id: 'note-1',
        classId: 'class-123',
        date: '2024-01-15',
        content: 'Algebra lesson',
        topics: ['algebra'],
        homework: null,
        objectives: null,
        createdDate: '2024-01-15',
        updatedDate: '2024-01-15',
        createdAt: new Date(),
        updatedAt: new Date(),
        class: {
          id: 'class-123',
          name: 'Math 101',
          subject: 'Mathematics'
        }
      }
    ];

    it('should return paginated notes', async () => {
      mockPrisma.classNote.findMany = jest.fn().mockResolvedValue(mockNotes);
      mockPrisma.classNote.count = jest.fn().mockResolvedValue(1);

      const result = await noteService.getNotes({}, { page: 1, limit: 10 });

      expect(result).toEqual({
        data: mockNotes,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1
        }
      });
    });

    it('should apply filters correctly', async () => {
      mockPrisma.classNote.findMany = jest.fn().mockResolvedValue(mockNotes);
      mockPrisma.classNote.count = jest.fn().mockResolvedValue(1);

      const filters = {
        classId: 'class-123',
        date: '2024-01-15',
        search: 'algebra'
      };

      await noteService.getNotes(filters, { page: 1, limit: 10 });

      expect(mockPrisma.classNote.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          classId: 'class-123',
          date: '2024-01-15',
          OR: expect.any(Array)
        }),
        include: expect.any(Object),
        orderBy: expect.any(Array),
        skip: 0,
        take: 10
      });
    });

    it('should handle database errors', async () => {
      mockPrisma.classNote.findMany = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(noteService.getNotes())
        .rejects.toThrow(new DatabaseError('Failed to fetch notes'));
    });
  });

  describe('updateNote', () => {
    const mockExistingNote = {
      id: 'note-123',
      classId: 'class-123',
      date: '2024-01-15',
      content: 'Original content',
      topics: ['algebra'],
      homework: null,
      objectives: null,
      createdDate: '2024-01-15',
      updatedDate: '2024-01-15',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockUpdatedNote = {
      ...mockExistingNote,
      content: 'Updated content',
      updatedDate: '2024-01-16',
      class: {
        id: 'class-123',
        name: 'Math 101',
        subject: 'Mathematics'
      }
    };

    it('should update note successfully', async () => {
      mockPrisma.classNote.findUnique = jest.fn().mockResolvedValue(mockExistingNote);
      mockPrisma.classNote.update = jest.fn().mockResolvedValue(mockUpdatedNote);

      const updateData = { content: 'Updated content' };
      const result = await noteService.updateNote('note-123', updateData);

      expect(mockPrisma.classNote.findUnique).toHaveBeenCalledWith({
        where: { id: 'note-123' }
      });
      expect(mockPrisma.classNote.update).toHaveBeenCalledWith({
        where: { id: 'note-123' },
        data: expect.objectContaining(updateData),
        include: expect.any(Object)
      });
      expect(result).toEqual(mockUpdatedNote);
    });

    it('should throw error if note not found', async () => {
      mockPrisma.classNote.findUnique = jest.fn().mockResolvedValue(null);

      await expect(noteService.updateNote('nonexistent', { content: 'Updated' }))
        .rejects.toThrow(new NotFoundError('Note not found'));
    });

    it('should handle database errors', async () => {
      mockPrisma.classNote.findUnique = jest.fn().mockResolvedValue(mockExistingNote);
      mockPrisma.classNote.update = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(noteService.updateNote('note-123', { content: 'Updated' }))
        .rejects.toThrow(new DatabaseError('Failed to update note'));
    });
  });

  describe('deleteNote', () => {
    const mockNote = {
      id: 'note-123',
      classId: 'class-123',
      date: '2024-01-15',
      content: 'Test content',
      topics: [],
      homework: null,
      objectives: null,
      createdDate: '2024-01-15',
      updatedDate: '2024-01-15',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should delete note successfully', async () => {
      mockPrisma.classNote.findUnique = jest.fn().mockResolvedValue(mockNote);
      mockPrisma.classNote.delete = jest.fn().mockResolvedValue(mockNote);

      await noteService.deleteNote('note-123');

      expect(mockPrisma.classNote.findUnique).toHaveBeenCalledWith({
        where: { id: 'note-123' }
      });
      expect(mockPrisma.classNote.delete).toHaveBeenCalledWith({
        where: { id: 'note-123' }
      });
    });

    it('should throw error if note not found', async () => {
      mockPrisma.classNote.findUnique = jest.fn().mockResolvedValue(null);

      await expect(noteService.deleteNote('nonexistent'))
        .rejects.toThrow(new NotFoundError('Note not found'));
    });

    it('should handle database errors', async () => {
      mockPrisma.classNote.findUnique = jest.fn().mockResolvedValue(mockNote);
      mockPrisma.classNote.delete = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(noteService.deleteNote('note-123'))
        .rejects.toThrow(new DatabaseError('Failed to delete note'));
    });
  });

  describe('getNotesByDateRange', () => {
    const mockNotes = [
      {
        id: 'note-1',
        classId: 'class-123',
        date: '2024-01-15',
        content: 'First lesson',
        topics: ['algebra'],
        homework: null,
        objectives: null,
        createdDate: '2024-01-15',
        updatedDate: '2024-01-15',
        createdAt: new Date(),
        updatedAt: new Date(),
        class: {
          id: 'class-123',
          name: 'Math 101',
          subject: 'Mathematics'
        }
      }
    ];

    it('should return notes within date range', async () => {
      mockPrisma.classNote.findMany = jest.fn().mockResolvedValue(mockNotes);

      const result = await noteService.getNotesByDateRange('class-123', '2024-01-01', '2024-01-31');

      expect(mockPrisma.classNote.findMany).toHaveBeenCalledWith({
        where: {
          classId: 'class-123',
          date: {
            gte: '2024-01-01',
            lte: '2024-01-31'
          }
        },
        include: expect.any(Object),
        orderBy: expect.any(Array)
      });
      expect(result).toEqual(mockNotes);
    });

    it('should handle database errors', async () => {
      mockPrisma.classNote.findMany = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(noteService.getNotesByDateRange('class-123', '2024-01-01', '2024-01-31'))
        .rejects.toThrow(new DatabaseError('Failed to fetch notes by date range'));
    });
  });

  describe('getRecentNotes', () => {
    const mockNotes = [
      {
        id: 'note-1',
        classId: 'class-123',
        date: '2024-01-15',
        content: 'Recent lesson',
        topics: ['algebra'],
        homework: null,
        objectives: null,
        createdDate: '2024-01-15',
        updatedDate: '2024-01-15',
        createdAt: new Date(),
        updatedAt: new Date(),
        class: {
          id: 'class-123',
          name: 'Math 101',
          subject: 'Mathematics'
        }
      }
    ];

    it('should return recent notes', async () => {
      mockPrisma.classNote.findMany = jest.fn().mockResolvedValue(mockNotes);

      const result = await noteService.getRecentNotes(5);

      expect(mockPrisma.classNote.findMany).toHaveBeenCalledWith({
        include: expect.any(Object),
        orderBy: [{ createdAt: 'desc' }],
        take: 5
      });
      expect(result).toEqual(mockNotes);
    });

    it('should handle database errors', async () => {
      mockPrisma.classNote.findMany = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(noteService.getRecentNotes())
        .rejects.toThrow(new DatabaseError('Failed to fetch recent notes'));
    });
  });
});