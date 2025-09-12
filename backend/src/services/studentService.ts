import { PrismaClient, Student, ClassEnrollment, Class } from '@prisma/client';
import { DatabaseError, NotFoundError, ConflictError } from '../utils/errors';

// Use a singleton pattern for Prisma client
let prisma: PrismaClient;

const getPrismaClient = () => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

export interface CreateStudentData {
  name: string;
  email: string;
  phone: string;
  grade: string;
  parentContact: string;
  enrollmentDate: string;
}

export interface UpdateStudentData {
  name?: string;
  email?: string;
  phone?: string;
  grade?: string;
  parentContact?: string;
  enrollmentDate?: string;
}

export interface GetStudentsQuery {
  page?: number;
  limit?: number;
  grade?: string;
  search?: string;
}

export interface PaginatedStudentsResponse {
  data: StudentWithEnrollments[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface StudentWithEnrollments extends Student {
  enrollments: (ClassEnrollment & {
    class: Class;
  })[];
  _count: {
    enrollments: number;
  };
}

export class StudentService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || getPrismaClient();
  }

  /**
   * Get all students with enrollment information (deprecated - use getAllStudentsPaginated)
   */
  async getAllStudents(): Promise<StudentWithEnrollments[]> {
    try {
      const students = await this.prisma.student.findMany({
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
        orderBy: {
          name: 'asc',
        },
      });

      return students;
    } catch (error) {
      throw new DatabaseError('Failed to fetch students', error);
    }
  }

  /**
   * Get all students with pagination, filtering, and enrollment information
   */
  async getAllStudentsPaginated(query: GetStudentsQuery = {}): Promise<PaginatedStudentsResponse> {
    try {
      const {
        page = 1,
        limit = 10,
        grade,
        search,
      } = query;

      // Ensure page is at least 1
      const currentPage = Math.max(1, page);
      const pageSize = Math.min(Math.max(1, limit), 100); // Max 100 items per page
      const skip = (currentPage - 1) * pageSize;

      // Build where condition for filtering
      const whereCondition: any = {};

      if (grade) {
        whereCondition.grade = {
          contains: grade,
          mode: 'insensitive',
        };
      }

      if (search) {
        whereCondition.OR = [
          {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            phone: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            grade: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            parentContact: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ];
      }

      // Get total count for pagination
      const total = await this.prisma.student.count({
        where: whereCondition,
      });

      // Get paginated data
      const students = await this.prisma.student.findMany({
        where: whereCondition,
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
        orderBy: {
          name: 'asc',
        },
        skip,
        take: pageSize,
      });

      const totalPages = Math.ceil(total / pageSize);

      return {
        data: students,
        pagination: {
          page: currentPage,
          limit: pageSize,
          total,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1,
        },
      };
    } catch (error) {
      throw new DatabaseError('Failed to fetch students', error);
    }
  }

  /**
   * Get a single student by ID with enrollment information
   */
  async getStudentById(id: string): Promise<StudentWithEnrollments> {
    try {
      const student = await this.prisma.student.findUnique({
        where: { id },
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

      if (!student) {
        throw new NotFoundError('Student not found');
      }

      return student;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch student', error);
    }
  }

  /**
   * Create a new student
   */
  async createStudent(data: CreateStudentData): Promise<Student> {
    try {
      // Check if email already exists
      const existingStudent = await this.prisma.student.findFirst({
        where: { email: data.email },
      });

      if (existingStudent) {
        throw new ConflictError('A student with this email already exists');
      }

      const newStudent = await this.prisma.student.create({
        data,
      });

      return newStudent;
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      throw new DatabaseError('Failed to create student', error);
    }
  }

  /**
   * Update an existing student
   */
  async updateStudent(id: string, data: UpdateStudentData): Promise<Student> {
    try {
      // First check if student exists
      const existingStudent = await this.prisma.student.findUnique({
        where: { id },
      });

      if (!existingStudent) {
        throw new NotFoundError('Student not found');
      }

      // If email is being updated, check for conflicts
      if (data.email && data.email !== existingStudent.email) {
        const emailConflict = await this.prisma.student.findFirst({
          where: { 
            email: data.email,
            id: { not: id },
          },
        });

        if (emailConflict) {
          throw new ConflictError('A student with this email already exists');
        }
      }

      const updatedStudent = await this.prisma.student.update({
        where: { id },
        data,
      });

      return updatedStudent;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw new DatabaseError('Failed to update student', error);
    }
  }

  /**
   * Update an existing student and return with enrollment information
   */
  async updateStudentWithEnrollments(id: string, data: UpdateStudentData): Promise<StudentWithEnrollments> {
    try {
      // First check if student exists
      const existingStudent = await this.prisma.student.findUnique({
        where: { id },
      });

      if (!existingStudent) {
        throw new NotFoundError('Student not found');
      }

      // If email is being updated, check for conflicts
      if (data.email && data.email !== existingStudent.email) {
        const emailConflict = await this.prisma.student.findFirst({
          where: { 
            email: data.email,
            id: { not: id },
          },
        });

        if (emailConflict) {
          throw new ConflictError('A student with this email already exists');
        }
      }

      // Update and fetch with enrollments in a single transaction
      const updatedStudent = await this.prisma.student.update({
        where: { id },
        data,
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

      return updatedStudent;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw new DatabaseError('Failed to update student', error);
    }
  }

  /**
   * Delete a student
   */
  async deleteStudent(id: string): Promise<void> {
    try {
      // First check if student exists
      const existingStudent = await this.prisma.student.findUnique({
        where: { id },
      });

      if (!existingStudent) {
        throw new NotFoundError('Student not found');
      }

      await this.prisma.student.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete student', error);
    }
  }

  /**
   * Get classes that a student is enrolled in
   */
  async getStudentClasses(studentId: string): Promise<Class[]> {
    try {
      // First check if student exists
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student) {
        throw new NotFoundError('Student not found');
      }

      const enrollments = await this.prisma.classEnrollment.findMany({
        where: { studentId },
        include: {
          class: true,
        },
        orderBy: {
          class: {
            name: 'asc',
          },
        },
      });

      return enrollments.map(enrollment => enrollment.class);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch student classes', error);
    }
  }

  /**
   * Search students by various criteria
   */
  async searchStudents(searchTerm: string, limit: number = 10): Promise<Student[]> {
    try {
      const students = await this.prisma.student.findMany({
        where: {
          OR: [
            {
              name: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
            {
              phone: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
            {
              grade: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          ],
        },
        orderBy: {
          name: 'asc',
        },
        take: Math.min(limit, 50), // Max 50 results
      });

      return students;
    } catch (error) {
      throw new DatabaseError('Failed to search students', error);
    }
  }
}

export default new StudentService();