import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { ClassService } from '../services/classService';
import { NotFoundError, ConflictError, DatabaseError } from '../utils/errors';

const mockPrisma = {
  class: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  student: {
    findUnique: jest.fn(),
  },
  classEnrollment: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
} as any;

describe('ClassService', () => {
  let classService: ClassService;

  beforeEach(() => {
    jest.clearAllMocks();
    classService = new ClassService(mockPrisma);
  });

  describe('getAllClasses', () => {
    it('should return all classes with enrollment information', async () => {
      const mockClasses = [
        {
          id: '1',
          name: 'Math 101',
          subject: 'Mathematics',
          description: 'Basic math',
          room: 'A101',
          capacity: 30,
          color: '#FF5733',
          createdDate: '2024-01-15',
          enrollments: [
            {
              studentId: 'student1',
              student: { id: 'student1', name: 'John Doe' },
            },
          ],
          _count: { enrollments: 1 },
        },
      ];

      mockPrisma.class.findMany.mockResolvedValue(mockClasses);

      const result = await classService.getAllClasses();

      expect(result).toEqual(mockClasses);
      expect(mockPrisma.class.findMany).toHaveBeenCalledWith({
        include: {
          enrollments: {
            include: {
              student: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should throw DatabaseError when Prisma fails', async () => {
      const error = new Error('Database connection failed');
      mockPrisma.class.findMany.mockRejectedValue(error);

      await expect(classService.getAllClasses()).rejects.toThrow(DatabaseError);
    });
  });

  describe('getClassById', () => {
    it('should return a class by ID', async () => {
      const mockClass = {
        id: '1',
        name: 'Math 101',
        subject: 'Mathematics',
        description: 'Basic math',
        room: 'A101',
        capacity: 30,
        color: '#FF5733',
        createdDate: '2024-01-15',
        enrollments: [],
        _count: { enrollments: 0 },
      };

      mockPrisma.class.findUnique.mockResolvedValue(mockClass);

      const result = await classService.getClassById('1');

      expect(result).toEqual(mockClass);
      expect(mockPrisma.class.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          enrollments: {
            include: {
              student: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundError when class does not exist', async () => {
      mockPrisma.class.findUnique.mockResolvedValue(null);

      await expect(classService.getClassById('nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('should throw DatabaseError when Prisma fails', async () => {
      const error = new Error('Database connection failed');
      mockPrisma.class.findUnique.mockRejectedValue(error);

      await expect(classService.getClassById('1')).rejects.toThrow(DatabaseError);
    });
  });

  describe('createClass', () => {
    it('should create a new class', async () => {
      const classData = {
        name: 'Physics 101',
        subject: 'Physics',
        description: 'Basic physics',
        room: 'B201',
        capacity: 25,
        color: '#33FF57',
      };

      const mockCreatedClass = {
        id: '1',
        ...classData,
        createdDate: '2024-01-15',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.class.create.mockResolvedValue(mockCreatedClass);

      const result = await classService.createClass(classData);

      expect(result).toEqual(mockCreatedClass);
      expect(mockPrisma.class.create).toHaveBeenCalledWith({
        data: {
          ...classData,
          createdDate: expect.any(String),
        },
      });
    });

    it('should throw DatabaseError when Prisma fails', async () => {
      const classData = {
        name: 'Physics 101',
        subject: 'Physics',
        description: 'Basic physics',
        room: 'B201',
        capacity: 25,
        color: '#33FF57',
      };

      const error = new Error('Database constraint violation');
      mockPrisma.class.create.mockRejectedValue(error);

      await expect(classService.createClass(classData)).rejects.toThrow(DatabaseError);
    });
  });

  describe('updateClass', () => {
    it('should update an existing class', async () => {
      const existingClass = {
        id: '1',
        name: 'Math 101',
        subject: 'Mathematics',
        description: 'Basic math',
        room: 'A101',
        capacity: 30,
        color: '#FF5733',
        createdDate: '2024-01-15',
      };

      const updateData = {
        name: 'Advanced Math 101',
        capacity: 35,
      };

      const updatedClass = {
        ...existingClass,
        ...updateData,
      };

      mockPrisma.class.findUnique.mockResolvedValue(existingClass);
      mockPrisma.class.update.mockResolvedValue(updatedClass);

      const result = await classService.updateClass('1', updateData);

      expect(result).toEqual(updatedClass);
      expect(mockPrisma.class.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockPrisma.class.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateData,
      });
    });

    it('should throw NotFoundError when class does not exist', async () => {
      mockPrisma.class.findUnique.mockResolvedValue(null);

      await expect(classService.updateClass('nonexistent', { name: 'New Name' })).rejects.toThrow(NotFoundError);
    });

    it('should throw DatabaseError when Prisma fails', async () => {
      const existingClass = { id: '1', name: 'Math 101' };
      mockPrisma.class.findUnique.mockResolvedValue(existingClass);

      const error = new Error('Database constraint violation');
      mockPrisma.class.update.mockRejectedValue(error);

      await expect(classService.updateClass('1', { name: 'New Name' })).rejects.toThrow(DatabaseError);
    });
  });

  describe('deleteClass', () => {
    it('should delete an existing class', async () => {
      const existingClass = { id: '1', name: 'Math 101' };
      mockPrisma.class.findUnique.mockResolvedValue(existingClass);
      mockPrisma.class.delete.mockResolvedValue(existingClass);

      await classService.deleteClass('1');

      expect(mockPrisma.class.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockPrisma.class.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundError when class does not exist', async () => {
      mockPrisma.class.findUnique.mockResolvedValue(null);

      await expect(classService.deleteClass('nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('should throw DatabaseError when Prisma fails', async () => {
      const existingClass = { id: '1', name: 'Math 101' };
      mockPrisma.class.findUnique.mockResolvedValue(existingClass);

      const error = new Error('Foreign key constraint violation');
      mockPrisma.class.delete.mockRejectedValue(error);

      await expect(classService.deleteClass('1')).rejects.toThrow(DatabaseError);
    });
  });

  describe('enrollStudent', () => {
    it('should enroll a student in a class', async () => {
      const mockClass = {
        id: 'class1',
        capacity: 30,
        _count: { enrollments: 5 },
      };
      const mockStudent = { id: 'student1', name: 'John Doe' };
      const mockEnrollment = {
        id: 'enrollment1',
        classId: 'class1',
        studentId: 'student1',
        enrolledAt: new Date(),
      };

      mockPrisma.class.findUnique.mockResolvedValue(mockClass);
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);
      mockPrisma.classEnrollment.findUnique.mockResolvedValue(null);
      mockPrisma.classEnrollment.create.mockResolvedValue(mockEnrollment);

      const result = await classService.enrollStudent('class1', 'student1');

      expect(result).toEqual(mockEnrollment);
      expect(mockPrisma.classEnrollment.create).toHaveBeenCalledWith({
        data: {
          classId: 'class1',
          studentId: 'student1',
        },
      });
    });

    it('should throw NotFoundError when class does not exist', async () => {
      mockPrisma.class.findUnique.mockResolvedValue(null);

      await expect(classService.enrollStudent('nonexistent', 'student1')).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when student does not exist', async () => {
      const mockClass = { id: 'class1', capacity: 30, _count: { enrollments: 5 } };
      mockPrisma.class.findUnique.mockResolvedValue(mockClass);
      mockPrisma.student.findUnique.mockResolvedValue(null);

      await expect(classService.enrollStudent('class1', 'nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when class is at capacity', async () => {
      const mockClass = {
        id: 'class1',
        capacity: 30,
        _count: { enrollments: 30 },
      };
      const mockStudent = { id: 'student1', name: 'John Doe' };

      mockPrisma.class.findUnique.mockResolvedValue(mockClass);
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);

      await expect(classService.enrollStudent('class1', 'student1')).rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError when student is already enrolled', async () => {
      const mockClass = {
        id: 'class1',
        capacity: 30,
        _count: { enrollments: 5 },
      };
      const mockStudent = { id: 'student1', name: 'John Doe' };
      const existingEnrollment = {
        id: 'enrollment1',
        classId: 'class1',
        studentId: 'student1',
      };

      mockPrisma.class.findUnique.mockResolvedValue(mockClass);
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);
      mockPrisma.classEnrollment.findUnique.mockResolvedValue(existingEnrollment);

      await expect(classService.enrollStudent('class1', 'student1')).rejects.toThrow(ConflictError);
    });
  });

  describe('unenrollStudent', () => {
    it('should unenroll a student from a class', async () => {
      const existingEnrollment = {
        id: 'enrollment1',
        classId: 'class1',
        studentId: 'student1',
      };

      mockPrisma.classEnrollment.findUnique.mockResolvedValue(existingEnrollment);
      mockPrisma.classEnrollment.delete.mockResolvedValue(existingEnrollment);

      await classService.unenrollStudent('class1', 'student1');

      expect(mockPrisma.classEnrollment.findUnique).toHaveBeenCalledWith({
        where: {
          classId_studentId: {
            classId: 'class1',
            studentId: 'student1',
          },
        },
      });
      expect(mockPrisma.classEnrollment.delete).toHaveBeenCalledWith({
        where: {
          classId_studentId: {
            classId: 'class1',
            studentId: 'student1',
          },
        },
      });
    });

    it('should throw NotFoundError when enrollment does not exist', async () => {
      mockPrisma.classEnrollment.findUnique.mockResolvedValue(null);

      await expect(classService.unenrollStudent('class1', 'student1')).rejects.toThrow(NotFoundError);
    });

    it('should throw DatabaseError when Prisma fails', async () => {
      const existingEnrollment = { id: 'enrollment1' };
      mockPrisma.classEnrollment.findUnique.mockResolvedValue(existingEnrollment);

      const error = new Error('Database connection failed');
      mockPrisma.classEnrollment.delete.mockRejectedValue(error);

      await expect(classService.unenrollStudent('class1', 'student1')).rejects.toThrow(DatabaseError);
    });
  });

  describe('getClassStudents', () => {
    it('should return students enrolled in a class', async () => {
      const mockClass = { id: 'class1', name: 'Math 101' };
      const mockEnrollments = [
        {
          student: { id: 'student1', name: 'John Doe', email: 'john@example.com' },
        },
        {
          student: { id: 'student2', name: 'Jane Smith', email: 'jane@example.com' },
        },
      ];

      mockPrisma.class.findUnique.mockResolvedValue(mockClass);
      mockPrisma.classEnrollment.findMany.mockResolvedValue(mockEnrollments);

      const result = await classService.getClassStudents('class1');

      expect(result).toEqual([
        { id: 'student1', name: 'John Doe', email: 'john@example.com' },
        { id: 'student2', name: 'Jane Smith', email: 'jane@example.com' },
      ]);
      expect(mockPrisma.classEnrollment.findMany).toHaveBeenCalledWith({
        where: { classId: 'class1' },
        include: {
          student: true,
        },
        orderBy: {
          student: {
            name: 'asc',
          },
        },
      });
    });

    it('should throw NotFoundError when class does not exist', async () => {
      mockPrisma.class.findUnique.mockResolvedValue(null);

      await expect(classService.getClassStudents('nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('should throw DatabaseError when Prisma fails', async () => {
      const mockClass = { id: 'class1', name: 'Math 101' };
      mockPrisma.class.findUnique.mockResolvedValue(mockClass);

      const error = new Error('Database connection failed');
      mockPrisma.classEnrollment.findMany.mockRejectedValue(error);

      await expect(classService.getClassStudents('class1')).rejects.toThrow(DatabaseError);
    });
  });
});