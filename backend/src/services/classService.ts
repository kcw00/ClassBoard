import { PrismaClient, Class, Student, ClassEnrollment } from '@prisma/client';
import { DatabaseError, NotFoundError, ConflictError } from '../utils/errors';
import CacheService from './cacheService';
import { parsePaginationQuery, createPaginationResult, generateOrderBy } from '../utils/pagination';

// Use a singleton pattern for Prisma client
let prisma: PrismaClient;

const getPrismaClient = () => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

export interface CreateClassData {
  name: string;
  subject: string;
  description: string;
  room: string;
  capacity: number;
  color: string;
}

export interface UpdateClassData {
  name?: string;
  subject?: string;
  description?: string;
  room?: string;
  capacity?: number;
  color?: string;
}

export interface GetClassesQuery {
  page?: number;
  limit?: number;
  subject?: string;
  search?: string;
}

export interface PaginatedClassesResponse {
  data: ClassWithEnrollments[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ClassWithEnrollments extends Class {
  enrollments: (ClassEnrollment & {
    student: Student;
  })[];
  _count: {
    enrollments: number;
  };
}

export class ClassService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || getPrismaClient();
  }

  /**
   * Get all classes with enrollment information (deprecated - use getAllClassesPaginated)
   */
  async getAllClasses(): Promise<ClassWithEnrollments[]> {
    try {
      const classes = await this.prisma.class.findMany({
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

      return classes;
    } catch (error) {
      throw new DatabaseError('Failed to fetch classes', error);
    }
  }

  /**
   * Get all classes with pagination, filtering, and enrollment information
   */
  async getAllClassesPaginated(query: GetClassesQuery = {}): Promise<PaginatedClassesResponse> {
    try {
      // Generate cache key
      const cacheKey = CacheService.generatePaginationKey(
        'classes',
        query.page || 1,
        query.limit || 10,
        { subject: query.subject, search: query.search }
      );

      // Check cache first
      const cachedResult = CacheService.get<PaginatedClassesResponse>('classes', cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      // Parse pagination parameters
      const { page, limit, skip } = parsePaginationQuery(query, {
        defaultLimit: 10,
        maxLimit: 100
      });

      // Build where condition for filtering
      const whereCondition: any = {};

      if (query.subject) {
        whereCondition.subject = {
          contains: query.subject,
          mode: 'insensitive',
        };
      }

      if (query.search) {
        whereCondition.OR = [
          {
            name: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            subject: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            room: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
        ];
      }

      // Use transaction for consistency and performance
      const result = await this.prisma.$transaction(async (tx) => {
        // Get total count for pagination
        const total = await tx.class.count({
          where: whereCondition,
        });

        // Get paginated data with optimized query
        const classes = await tx.class.findMany({
          where: whereCondition,
          include: {
            enrollments: {
              include: {
                student: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    grade: true,
                    phone: true,
                    parentContact: true,
                    enrollmentDate: true,
                    createdAt: true,
                    updatedAt: true
                  }
                },
              },
            },
            _count: {
              select: {
                enrollments: true,
              },
            },
          },
          orderBy: generateOrderBy('createdAt', 'desc'),
          skip,
          take: limit,
        });

        return createPaginationResult(classes, total, page, limit);
      });

      // Cache the result
      CacheService.set('classes', cacheKey, result);

      return result;
    } catch (error) {
      throw new DatabaseError('Failed to fetch classes', error);
    }
  }

  /**
   * Get a single class by ID with enrollment information
   */
  async getClassById(id: string): Promise<ClassWithEnrollments> {
    try {
      // Generate cache key
      const cacheKey = CacheService.generateEntityKey('class', id, ['enrollments', 'students']);

      // Check cache first
      const cachedResult = CacheService.get<ClassWithEnrollments>('classes', cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      const classData = await this.prisma.class.findUnique({
        where: { id },
        include: {
          enrollments: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  grade: true,
                  phone: true,
                  parentContact: true,
                  createdAt: true,
                  updatedAt: true,
                  enrollmentDate: true
                }
              },
            },
            orderBy: {
              student: {
                name: 'asc'
              }
            }
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      });

      if (!classData) {
        throw new NotFoundError('Class not found');
      }

      // Cache the result
      CacheService.set('classes', cacheKey, classData);

      return classData;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch class', error);
    }
  }

  /**
   * Create a new class
   */
  async createClass(data: CreateClassData): Promise<Class> {
    try {
      const currentDate = new Date().toISOString().split('T')[0];

      const newClass = await this.prisma.class.create({
        data: {
          ...data,
          createdDate: currentDate,
        },
      });

      // Invalidate classes cache since we added a new class
      CacheService.invalidateRelated('classes');

      return newClass;
    } catch (error) {
      throw new DatabaseError('Failed to create class', error);
    }
  }

  /**
   * Update an existing class
   */
  async updateClass(id: string, data: UpdateClassData): Promise<Class> {
    try {
      // First check if class exists
      const existingClass = await this.prisma.class.findUnique({
        where: { id },
      });

      if (!existingClass) {
        throw new NotFoundError('Class not found');
      }

      const updatedClass = await this.prisma.class.update({
        where: { id },
        data,
      });

      return updatedClass;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update class', error);
    }
  }

  /**
   * Update an existing class and return with enrollment information
   */
  async updateClassWithEnrollments(id: string, data: UpdateClassData): Promise<ClassWithEnrollments> {
    try {
      // First check if class exists
      const existingClass = await this.prisma.class.findUnique({
        where: { id },
      });

      if (!existingClass) {
        throw new NotFoundError('Class not found');
      }

      // Update and fetch with enrollments in a single transaction
      const updatedClass = await this.prisma.class.update({
        where: { id },
        data,
        include: {
          enrollments: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  createdAt: true,
                  updatedAt: true,
                  email: true,
                  phone: true,
                  grade: true,
                  parentContact: true,
                  enrollmentDate: true
                }
              },
            },
            orderBy: {
              student: {
                name: 'asc'
              }
            }
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      });

      // Invalidate related cache entries
      CacheService.invalidateRelated('classes', id);

      return updatedClass;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update class', error);
    }
  }

  /**
   * Delete a class
   */
  async deleteClass(id: string): Promise<void> {
    try {
      // First check if class exists
      const existingClass = await this.prisma.class.findUnique({
        where: { id },
      });

      if (!existingClass) {
        throw new NotFoundError('Class not found');
      }

      await this.prisma.class.delete({
        where: { id },
      });

      // Invalidate related cache entries
      CacheService.invalidateRelated('classes', id);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete class', error);
    }
  }

  /**
   * Enroll a student in a class
   */
  async enrollStudent(classId: string, studentId: string): Promise<ClassEnrollment> {
    try {
      // Use transaction for consistency
      const enrollment = await this.prisma.$transaction(async (tx) => {
        // Check if class exists and get current enrollment count
        const classData = await tx.class.findUnique({
          where: { id: classId },
          include: {
            _count: {
              select: {
                enrollments: true,
              },
            },
          },
        });

        if (!classData) {
          throw new NotFoundError('Class not found');
        }

        // Check if student exists
        const student = await tx.student.findUnique({
          where: { id: studentId },
        });

        if (!student) {
          throw new NotFoundError('Student not found');
        }

        // Check if class is at capacity
        if (classData._count.enrollments >= classData.capacity) {
          throw new ConflictError('Class is at full capacity');
        }

        // Check if student is already enrolled
        const existingEnrollment = await tx.classEnrollment.findUnique({
          where: {
            classId_studentId: {
              classId,
              studentId,
            },
          },
        });

        if (existingEnrollment) {
          throw new ConflictError('Student is already enrolled in this class');
        }

        // Create enrollment
        return await tx.classEnrollment.create({
          data: {
            classId,
            studentId,
          },
        });
      });

      // Invalidate related cache entries
      CacheService.invalidateRelated('classes', classId);
      CacheService.invalidateRelated('students', studentId);

      return enrollment;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw new DatabaseError('Failed to enroll student', error);
    }
  }

  /**
   * Unenroll a student from a class
   */
  async unenrollStudent(classId: string, studentId: string): Promise<void> {
    try {
      // Check if enrollment exists
      const enrollment = await this.prisma.classEnrollment.findUnique({
        where: {
          classId_studentId: {
            classId,
            studentId,
          },
        },
      });

      if (!enrollment) {
        throw new NotFoundError('Student is not enrolled in this class');
      }

      // Delete enrollment
      await this.prisma.classEnrollment.delete({
        where: {
          classId_studentId: {
            classId,
            studentId,
          },
        },
      });

      // Invalidate related cache entries
      CacheService.invalidateRelated('classes', classId);
      CacheService.invalidateRelated('students', studentId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to unenroll student', error);
    }
  }

  /**
   * Get students enrolled in a class
   */
  async getClassStudents(classId: string): Promise<Student[]> {
    try {
      // First check if class exists
      const classData = await this.prisma.class.findUnique({
        where: { id: classId },
      });

      if (!classData) {
        throw new NotFoundError('Class not found');
      }

      const enrollments = await this.prisma.classEnrollment.findMany({
        where: { classId },
        include: {
          student: true,
        },
        orderBy: {
          student: {
            name: 'asc',
          },
        },
      });

      return enrollments.map(enrollment => enrollment.student);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch class students', error);
    }
  }
}

export default new ClassService();