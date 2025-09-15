import { PrismaClient, ClassNote } from '@prisma/client';
import { CreateNoteData, UpdateNoteData, NoteFilters } from '../types/note';
import { NotFoundError, DatabaseError } from '../utils/errors';

interface PaginationOptions {
  page?: number;
  limit?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const prisma = new PrismaClient();

export class NoteService {
  async createNote(data: CreateNoteData): Promise<ClassNote> {
    try {
      // Verify class exists
      const classExists = await prisma.class.findUnique({
        where: { id: data.classId }
      });

      if (!classExists) {
        throw new NotFoundError('Class not found');
      }

      const note = await prisma.classNote.create({
        data: {
          classId: data.classId,
          date: data.date,
          content: data.content,
          topics: data.topics || [],
          homework: data.homework,
          objectives: data.objectives,
          createdDate: new Date().toISOString().split('T')[0],
          updatedDate: new Date().toISOString().split('T')[0]
        }
      });

      return note;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to create note');
    }
  }

  async getNoteById(id: string): Promise<ClassNote | null> {
    try {
      const note = await prisma.classNote.findUnique({
        where: { id },
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

      return note;
    } catch (error) {
      throw new DatabaseError('Failed to fetch note');
    }
  }

  async getNotes(
    filters: NoteFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResponse<ClassNote>> {
    try {
      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (filters.classId) {
        where.classId = filters.classId;
      }

      if (filters.date) {
        where.date = filters.date;
      }

      if (filters.dateFrom || filters.dateTo) {
        where.date = {};
        if (filters.dateFrom) {
          where.date.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          where.date.lte = filters.dateTo;
        }
      }

      if (filters.topics && filters.topics.length > 0) {
        where.topics = {
          hasSome: filters.topics
        };
      }

      if (filters.search) {
        where.OR = [
          { content: { contains: filters.search, mode: 'insensitive' } },
          { homework: { contains: filters.search, mode: 'insensitive' } },
          { objectives: { contains: filters.search, mode: 'insensitive' } },
          { topics: { hasSome: [filters.search] } }
        ];
      }

      const [notes, total] = await Promise.all([
        prisma.classNote.findMany({
          where,
          include: {
            class: {
              select: {
                id: true,
                name: true,
                subject: true
              }
            }
          },
          orderBy: [
            { date: 'desc' },
            { createdAt: 'desc' }
          ],
          skip,
          take: limit
        }),
        prisma.classNote.count({ where })
      ]);

      return {
        data: notes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new DatabaseError('Failed to fetch notes');
    }
  }

  async getNotesByClass(
    classId: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResponse<ClassNote>> {
    return this.getNotes({ classId }, pagination);
  }

  async updateNote(id: string, data: UpdateNoteData): Promise<ClassNote> {
    try {
      const existingNote = await prisma.classNote.findUnique({
        where: { id }
      });

      if (!existingNote) {
        throw new NotFoundError('Note not found');
      }

      const note = await prisma.classNote.update({
        where: { id },
        data: {
          ...data,
          updatedDate: new Date().toISOString().split('T')[0]
        },
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

      return note;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update note');
    }
  }

  async deleteNote(id: string): Promise<void> {
    try {
      const existingNote = await prisma.classNote.findUnique({
        where: { id }
      });

      if (!existingNote) {
        throw new NotFoundError('Note not found');
      }

      await prisma.classNote.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete note');
    }
  }

  async getNotesByDateRange(
    classId: string,
    startDate: string,
    endDate: string
  ): Promise<ClassNote[]> {
    try {
      const notes = await prisma.classNote.findMany({
        where: {
          classId,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              subject: true
            }
          }
        },
        orderBy: [
          { date: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      return notes;
    } catch (error) {
      throw new DatabaseError('Failed to fetch notes by date range');
    }
  }

  async getRecentNotes(limit: number = 10): Promise<ClassNote[]> {
    try {
      const notes = await prisma.classNote.findMany({
        include: {
          class: {
            select: {
              id: true,
              name: true,
              subject: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        take: limit
      });

      return notes;
    } catch (error) {
      throw new DatabaseError('Failed to fetch recent notes');
    }
  }
}

export const noteService = new NoteService();