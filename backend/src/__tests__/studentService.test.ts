import { PrismaClient } from '@prisma/client';
import { StudentService } from '../services/studentService';
import { DatabaseError, NotFoundError, ConflictError } from '../utils/errors';

// Mock Prisma Client
const mockPrisma = {
  student: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  classEnrollment: {
    findMany: jest.fn(),
  },
} as unknown as PrismaClient;

describe('StudentService', () => {
  let studentService: StudentService;

  beforeEach(() => {
    studentService = new StudentService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('getAllStudentsPaginated', () => {
    const mockStudents = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        grade: '10th Grade',
        parentContact: 'Jane Doe',
        enrollmentDate: '2024-01-01',
        enrollments: [],
        _count: { enrollments: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return paginated students with default parameters', async () => {
      (mockPrisma.student.count as jest.Mock).mockResolvedValue(1);
      (mockPrisma.student.findMany as jest.Mock).mockResolvedValue(mockStudents);

      const result = await studentService.getAllStudentsPaginated();

      expect(result.data).toEqual(mockStudents);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('should apply search filter correctly', async () => {
      (mockPrisma.student.count as jest.Mock).mockResolvedValue(1);
      (mockPrisma.student.findMany as jest.Mock).mockResolvedValue(mockStudents);

      await studentService.getAllStudentsPaginated({ search: 'John' });

      expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'John', mode: 'insensitive' } },
              { email: { contains: 'John', mode: 'insensitive' } },
              { phone: { contains: 'John', mode: 'insensitive' } },
              { grade: { contains: 'John', mode: 'insensitive' } },
              { parentContact: { contains: 'John', mode: 'insensitive' } },
            ],
          },
        })
      );
    });

    it('should apply grade filter correctly', async () => {
      (mockPrisma.student.count as jest.Mock).mockResolvedValue(1);
      (mockPrisma.student.findMany as jest.Mock).mockResolvedValue(mockStudents);

      await studentService.getAllStudentsPaginated({ grade: '10th' });

      expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            grade: { contains: '10th', mode: 'insensitive' },
          },
        })
      );
    });

    it('should handle pagination correctly', async () => {
      (mockPrisma.student.count as jest.Mock).mockResolvedValue(25);
      (mockPrisma.student.findMany as jest.Mock).mockResolvedValue(mockStudents);

      const result = await studentService.getAllStudentsPaginated({ page: 2, limit: 5 });

      expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 25,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });

    it('should throw DatabaseError on database failure', async () => {
      (mockPrisma.student.count as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(studentService.getAllStudentsPaginated()).rejects.toThrow(DatabaseError);
    });
  });

  describe('getStudentById', () => {
    const mockStudent = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      grade: '10th Grade',
      parentContact: 'Jane Doe',
      enrollmentDate: '2024-01-01',
      enrollments: [],
      _count: { enrollments: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return student by ID', async () => {
      (mockPrisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);

      const result = await studentService.getStudentById('1');

      expect(result).toEqual(mockStudent);
      expect(mockPrisma.student.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          enrollments: {
            include: {
              class: true,
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

    it('should throw NotFoundError when student does not exist', async () => {
      (mockPrisma.student.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(studentService.getStudentById('1')).rejects.toThrow(NotFoundError);
    });

    it('should throw DatabaseError on database failure', async () => {
      (mockPrisma.student.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(studentService.getStudentById('1')).rejects.toThrow(DatabaseError);
    });
  });

  describe('createStudent', () => {
    const studentData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      grade: '10th Grade',
      parentContact: 'Jane Doe',
      enrollmentDate: '2024-01-01',
    };

    const mockCreatedStudent = {
      id: '1',
      ...studentData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a new student', async () => {
      (mockPrisma.student.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.student.create as jest.Mock).mockResolvedValue(mockCreatedStudent);

      const result = await studentService.createStudent(studentData);

      expect(result).toEqual(mockCreatedStudent);
      expect(mockPrisma.student.create).toHaveBeenCalledWith({
        data: studentData,
      });
    });

    it('should throw ConflictError when email already exists', async () => {
      (mockPrisma.student.findFirst as jest.Mock).mockResolvedValue({ id: '2', email: 'john@example.com' });

      await expect(studentService.createStudent(studentData)).rejects.toThrow(ConflictError);
    });

    it('should throw DatabaseError on database failure', async () => {
      (mockPrisma.student.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.student.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(studentService.createStudent(studentData)).rejects.toThrow(DatabaseError);
    });
  });

  describe('updateStudent', () => {
    const updateData = {
      name: 'John Updated',
      grade: '11th Grade',
    };

    const mockExistingStudent = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      grade: '10th Grade',
      parentContact: 'Jane Doe',
      enrollmentDate: '2024-01-01',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockUpdatedStudent = {
      ...mockExistingStudent,
      ...updateData,
    };

    it('should update an existing student', async () => {
      (mockPrisma.student.findUnique as jest.Mock).mockResolvedValue(mockExistingStudent);
      (mockPrisma.student.update as jest.Mock).mockResolvedValue(mockUpdatedStudent);

      const result = await studentService.updateStudent('1', updateData);

      expect(result).toEqual(mockUpdatedStudent);
      expect(mockPrisma.student.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateData,
      });
    });

    it('should throw NotFoundError when student does not exist', async () => {
      (mockPrisma.student.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(studentService.updateStudent('1', updateData)).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when updating to existing email', async () => {
      (mockPrisma.student.findUnique as jest.Mock).mockResolvedValue(mockExistingStudent);
      (mockPrisma.student.findFirst as jest.Mock).mockResolvedValue({ id: '2', email: 'new@example.com' });

      await expect(studentService.updateStudent('1', { email: 'new@example.com' })).rejects.toThrow(ConflictError);
    });

    it('should allow updating to same email', async () => {
      (mockPrisma.student.findUnique as jest.Mock).mockResolvedValue(mockExistingStudent);
      (mockPrisma.student.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.student.update as jest.Mock).mockResolvedValue(mockExistingStudent);

      const result = await studentService.updateStudent('1', { email: 'john@example.com' });

      expect(result).toEqual(mockExistingStudent);
    });

    it('should throw DatabaseError on database failure', async () => {
      (mockPrisma.student.findUnique as jest.Mock).mockResolvedValue(mockExistingStudent);
      (mockPrisma.student.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(studentService.updateStudent('1', updateData)).rejects.toThrow(DatabaseError);
    });
  });

  describe('deleteStudent', () => {
    const mockStudent = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      grade: '10th Grade',
      parentContact: 'Jane Doe',
      enrollmentDate: '2024-01-01',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should delete an existing student', async () => {
      (mockPrisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);
      (mockPrisma.student.delete as jest.Mock).mockResolvedValue(mockStudent);

      await studentService.deleteStudent('1');

      expect(mockPrisma.student.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundError when student does not exist', async () => {
      (mockPrisma.student.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(studentService.deleteStudent('1')).rejects.toThrow(NotFoundError);
    });

    it('should throw DatabaseError on database failure', async () => {
      (mockPrisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);
      (mockPrisma.student.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(studentService.deleteStudent('1')).rejects.toThrow(DatabaseError);
    });
  });

  describe('getStudentClasses', () => {
    const mockStudent = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
    };

    const mockEnrollments = [
      {
        id: '1',
        classId: 'class1',
        studentId: '1',
        class: {
          id: 'class1',
          name: 'Math 101',
          subject: 'Mathematics',
        },
      },
    ];

    it('should return classes for enrolled student', async () => {
      (mockPrisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);
      (mockPrisma.classEnrollment.findMany as jest.Mock).mockResolvedValue(mockEnrollments);

      const result = await studentService.getStudentClasses('1');

      expect(result).toEqual([mockEnrollments[0].class]);
      expect(mockPrisma.classEnrollment.findMany).toHaveBeenCalledWith({
        where: { studentId: '1' },
        include: {
          class: true,
        },
        orderBy: {
          class: {
            name: 'asc',
          },
        },
      });
    });

    it('should throw NotFoundError when student does not exist', async () => {
      (mockPrisma.student.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(studentService.getStudentClasses('1')).rejects.toThrow(NotFoundError);
    });

    it('should throw DatabaseError on database failure', async () => {
      (mockPrisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);
      (mockPrisma.classEnrollment.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(studentService.getStudentClasses('1')).rejects.toThrow(DatabaseError);
    });
  });

  describe('searchStudents', () => {
    const mockStudents = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        grade: '10th Grade',
        parentContact: 'Jane Doe',
        enrollmentDate: '2024-01-01',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should search students by term', async () => {
      (mockPrisma.student.findMany as jest.Mock).mockResolvedValue(mockStudents);

      const result = await studentService.searchStudents('John', 10);

      expect(result).toEqual(mockStudents);
      expect(mockPrisma.student.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'John', mode: 'insensitive' } },
            { email: { contains: 'John', mode: 'insensitive' } },
            { phone: { contains: 'John', mode: 'insensitive' } },
            { grade: { contains: 'John', mode: 'insensitive' } },
          ],
        },
        orderBy: {
          name: 'asc',
        },
        take: 10,
      });
    });

    it('should limit results to maximum of 50', async () => {
      (mockPrisma.student.findMany as jest.Mock).mockResolvedValue(mockStudents);

      await studentService.searchStudents('John', 100);

      expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });

    it('should throw DatabaseError on database failure', async () => {
      (mockPrisma.student.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(studentService.searchStudents('John')).rejects.toThrow(DatabaseError);
    });
  });
});