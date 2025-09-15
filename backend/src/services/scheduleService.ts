import { PrismaClient, Schedule, ScheduleException } from '@prisma/client';
import { DatabaseError, NotFoundError, ConflictError } from '../utils/errors';

// Use a singleton pattern for Prisma client
let prisma: PrismaClient;

const getPrismaClient = () => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

export interface CreateScheduleData {
  classId: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
}

export interface UpdateScheduleData {
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
}

export interface CreateScheduleExceptionData {
  scheduleId: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  cancelled?: boolean;
}

export interface UpdateScheduleExceptionData {
  date?: string;
  startTime?: string;
  endTime?: string;
  cancelled?: boolean;
}

export interface ScheduleWithExceptions extends Schedule {
  exceptions: ScheduleException[];
}

export interface GetSchedulesQuery {
  page?: number;
  limit?: number;
  dayOfWeek?: number;
  search?: string;
}

export interface PaginatedSchedulesResponse {
  data: ScheduleWithExceptions[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ScheduleConflict {
  conflictType: 'schedule' | 'exception';
  conflictingId: string;
  conflictingSchedule?: Schedule;
  conflictingException?: ScheduleException;
  message: string;
}

export class ScheduleService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || getPrismaClient();
  }

  /**
   * Get all schedules for a class (deprecated - use getClassSchedulesPaginated)
   */
  async getClassSchedules(classId: string): Promise<ScheduleWithExceptions[]> {
    try {
      // First check if class exists
      const classData = await this.prisma.class.findUnique({
        where: { id: classId },
      });

      if (!classData) {
        throw new NotFoundError('Class not found');
      }

      const schedules = await this.prisma.schedule.findMany({
        where: { classId },
        include: {
          exceptions: {
            orderBy: {
              date: 'asc',
            },
          },
        },
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' },
        ],
      });

      return schedules;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch class schedules', error);
    }
  }

  /**
   * Get all schedules for a class with pagination and filtering
   */
  async getClassSchedulesPaginated(classId: string, query: GetSchedulesQuery = {}): Promise<PaginatedSchedulesResponse> {
    try {
      // First check if class exists
      const classData = await this.prisma.class.findUnique({
        where: { id: classId },
      });

      if (!classData) {
        throw new NotFoundError('Class not found');
      }

      const {
        page = 1,
        limit = 10,
        dayOfWeek,
        search,
      } = query;

      // Ensure page is at least 1
      const currentPage = Math.max(1, page);
      const pageSize = Math.min(Math.max(1, limit), 50); // Max 50 items per page
      const skip = (currentPage - 1) * pageSize;

      // Build where condition for filtering
      const whereCondition: any = { classId };

      if (dayOfWeek !== undefined) {
        whereCondition.dayOfWeek = dayOfWeek;
      }

      if (search) {
        // Search isn't very meaningful for schedules, but we can search in time ranges
        whereCondition.OR = [
          {
            startTime: {
              contains: search,
            },
          },
          {
            endTime: {
              contains: search,
            },
          },
        ];
      }

      // Get total count for pagination
      const total = await this.prisma.schedule.count({
        where: whereCondition,
      });

      // Get paginated data
      const schedules = await this.prisma.schedule.findMany({
        where: whereCondition,
        include: {
          exceptions: {
            orderBy: {
              date: 'asc',
            },
          },
        },
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' },
        ],
        skip,
        take: pageSize,
      });

      const totalPages = Math.ceil(total / pageSize);

      return {
        data: schedules,
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
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch class schedules', error);
    }
  }

  /**
   * Get a single schedule by ID with exceptions
   */
  async getScheduleById(id: string): Promise<ScheduleWithExceptions> {
    try {
      const schedule = await this.prisma.schedule.findUnique({
        where: { id },
        include: {
          exceptions: {
            orderBy: {
              date: 'asc',
            },
          },
        },
      });

      if (!schedule) {
        throw new NotFoundError('Schedule not found');
      }

      return schedule;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch schedule', error);
    }
  }

  /**
   * Create a new schedule with conflict detection
   */
  async createSchedule(data: CreateScheduleData): Promise<Schedule> {
    try {
      // Check if class exists
      const classData = await this.prisma.class.findUnique({
        where: { id: data.classId },
      });

      if (!classData) {
        throw new NotFoundError('Class not found');
      }

      // Check for schedule conflicts
      const conflicts = await this.detectScheduleConflicts(data);
      if (conflicts.length > 0) {
        throw new ConflictError(`Schedule conflicts detected: ${conflicts[0].message}`);
      }

      const newSchedule = await this.prisma.schedule.create({
        data,
      });

      return newSchedule;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw new DatabaseError('Failed to create schedule', error);
    }
  }

  /**
   * Update an existing schedule with conflict detection
   */
  async updateSchedule(id: string, data: UpdateScheduleData): Promise<Schedule> {
    try {
      // First check if schedule exists
      const existingSchedule = await this.prisma.schedule.findUnique({
        where: { id },
      });

      if (!existingSchedule) {
        throw new NotFoundError('Schedule not found');
      }

      // Create updated schedule data for conflict detection
      const updatedData = {
        classId: existingSchedule.classId,
        dayOfWeek: data.dayOfWeek ?? existingSchedule.dayOfWeek,
        startTime: data.startTime ?? existingSchedule.startTime,
        endTime: data.endTime ?? existingSchedule.endTime,
      };

      // Check for schedule conflicts (excluding current schedule)
      const conflicts = await this.detectScheduleConflicts(updatedData, id);
      if (conflicts.length > 0) {
        throw new ConflictError(`Schedule conflicts detected: ${conflicts[0].message}`);
      }

      const updatedSchedule = await this.prisma.schedule.update({
        where: { id },
        data,
      });

      return updatedSchedule;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw new DatabaseError('Failed to update schedule', error);
    }
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(id: string): Promise<void> {
    try {
      // First check if schedule exists
      const existingSchedule = await this.prisma.schedule.findUnique({
        where: { id },
      });

      if (!existingSchedule) {
        throw new NotFoundError('Schedule not found');
      }

      await this.prisma.schedule.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete schedule', error);
    }
  }

  /**
   * Create a schedule exception
   */
  async createScheduleException(data: CreateScheduleExceptionData): Promise<ScheduleException> {
    try {
      // Check if schedule exists
      const schedule = await this.prisma.schedule.findUnique({
        where: { id: data.scheduleId },
      });

      if (!schedule) {
        throw new NotFoundError('Schedule not found');
      }

      // Check if exception already exists for this date
      const existingException = await this.prisma.scheduleException.findFirst({
        where: {
          scheduleId: data.scheduleId,
          date: data.date,
        },
      });

      if (existingException) {
        throw new ConflictError('Schedule exception already exists for this date');
      }

      const currentDate = new Date().toISOString().split('T')[0];
      
      const newException = await this.prisma.scheduleException.create({
        data: {
          ...data,
          createdDate: currentDate,
        },
      });

      return newException;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw new DatabaseError('Failed to create schedule exception', error);
    }
  }

  /**
   * Update a schedule exception
   */
  async updateScheduleException(id: string, data: UpdateScheduleExceptionData): Promise<ScheduleException> {
    try {
      // First check if exception exists
      const existingException = await this.prisma.scheduleException.findUnique({
        where: { id },
      });

      if (!existingException) {
        throw new NotFoundError('Schedule exception not found');
      }

      // If date is being updated, check for conflicts
      if (data.date && data.date !== existingException.date) {
        const conflictingException = await this.prisma.scheduleException.findFirst({
          where: {
            scheduleId: existingException.scheduleId,
            date: data.date,
            id: { not: id }, // Exclude current exception
          },
        });

        if (conflictingException) {
          throw new ConflictError('Schedule exception already exists for this date');
        }
      }

      const updatedException = await this.prisma.scheduleException.update({
        where: { id },
        data,
      });

      return updatedException;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw new DatabaseError('Failed to update schedule exception', error);
    }
  }

  /**
   * Delete a schedule exception
   */
  async deleteScheduleException(id: string): Promise<void> {
    try {
      // First check if exception exists
      const existingException = await this.prisma.scheduleException.findUnique({
        where: { id },
      });

      if (!existingException) {
        throw new NotFoundError('Schedule exception not found');
      }

      await this.prisma.scheduleException.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete schedule exception', error);
    }
  }

  /**
   * Get schedule exceptions for a specific schedule
   */
  async getScheduleExceptions(scheduleId: string): Promise<ScheduleException[]> {
    try {
      // First check if schedule exists
      const schedule = await this.prisma.schedule.findUnique({
        where: { id: scheduleId },
      });

      if (!schedule) {
        throw new NotFoundError('Schedule not found');
      }

      const exceptions = await this.prisma.scheduleException.findMany({
        where: { scheduleId },
        orderBy: {
          date: 'asc',
        },
      });

      return exceptions;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch schedule exceptions', error);
    }
  }

  /**
   * Detect schedule conflicts for a given schedule data
   */
  private async detectScheduleConflicts(
    scheduleData: CreateScheduleData,
    excludeScheduleId?: string
  ): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = [];

    try {
      // Find overlapping schedules for the same class on the same day
      const whereCondition: any = {
        classId: scheduleData.classId,
        dayOfWeek: scheduleData.dayOfWeek,
      };

      if (excludeScheduleId) {
        whereCondition.id = { not: excludeScheduleId };
      }

      const overlappingSchedules = await this.prisma.schedule.findMany({
        where: whereCondition,
      });

      for (const existingSchedule of overlappingSchedules) {
        if (this.isTimeOverlapping(
          scheduleData.startTime,
          scheduleData.endTime,
          existingSchedule.startTime,
          existingSchedule.endTime
        )) {
          conflicts.push({
            conflictType: 'schedule',
            conflictingId: existingSchedule.id,
            conflictingSchedule: existingSchedule,
            message: `Schedule conflicts with existing schedule on ${this.getDayName(scheduleData.dayOfWeek)} from ${existingSchedule.startTime} to ${existingSchedule.endTime}`,
          });
        }
      }

      return conflicts;
    } catch (error) {
      throw new DatabaseError('Failed to detect schedule conflicts', error);
    }
  }

  /**
   * Check if two time ranges overlap
   */
  private isTimeOverlapping(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    const [start1Hours, start1Mins] = start1.split(':').map(Number);
    const [end1Hours, end1Mins] = end1.split(':').map(Number);
    const [start2Hours, start2Mins] = start2.split(':').map(Number);
    const [end2Hours, end2Mins] = end2.split(':').map(Number);

    const start1TotalMinutes = start1Hours * 60 + start1Mins;
    const end1TotalMinutes = end1Hours * 60 + end1Mins;
    const start2TotalMinutes = start2Hours * 60 + start2Mins;
    const end2TotalMinutes = end2Hours * 60 + end2Mins;

    return start1TotalMinutes < end2TotalMinutes && start2TotalMinutes < end1TotalMinutes;
  }

  /**
   * Create multiple schedules in bulk with conflict detection
   */
  async createSchedulesBulk(schedules: CreateScheduleData[]): Promise<Schedule[]> {
    try {
      const createdSchedules: Schedule[] = [];
      const conflicts: string[] = [];

      // Process each schedule
      for (let i = 0; i < schedules.length; i++) {
        const scheduleData = schedules[i];
        
        try {
          // Check conflicts with existing schedules and other schedules in this bulk operation
          const existingConflicts = await this.detectScheduleConflicts(scheduleData);
          const bulkConflicts = this.detectBulkConflicts(scheduleData, schedules.slice(0, i));
          
          if (existingConflicts.length > 0 || bulkConflicts.length > 0) {
            conflicts.push(`Schedule ${i + 1}: ${existingConflicts[0]?.message || bulkConflicts[0]}`);
            continue;
          }

          const schedule = await this.prisma.schedule.create({
            data: scheduleData,
          });
          
          createdSchedules.push(schedule);
        } catch (error) {
          conflicts.push(`Schedule ${i + 1}: Failed to create - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (conflicts.length > 0 && createdSchedules.length === 0) {
        throw new ConflictError(`All schedules have conflicts: ${conflicts.join('; ')}`);
      }

      return createdSchedules;
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      throw new DatabaseError('Failed to create schedules in bulk', error);
    }
  }

  /**
   * Get weekly schedule overview for a class
   */
  async getWeeklyScheduleOverview(classId: string): Promise<{ [day: string]: ScheduleWithExceptions[] }> {
    try {
      const schedules = await this.getClassSchedules(classId);
      
      const weeklyOverview: { [day: string]: ScheduleWithExceptions[] } = {
        Sunday: [],
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
      };

      schedules.forEach(schedule => {
        const dayName = this.getDayName(schedule.dayOfWeek);
        weeklyOverview[dayName].push(schedule);
      });

      // Sort schedules within each day by start time
      Object.keys(weeklyOverview).forEach(day => {
        weeklyOverview[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
      });

      return weeklyOverview;
    } catch (error) {
      throw new DatabaseError('Failed to get weekly schedule overview', error);
    }
  }

  /**
   * Get schedule statistics for a class
   */
  async getScheduleStats(classId: string): Promise<{
    totalSchedules: number;
    schedulesByDay: { [day: string]: number };
    totalExceptions: number;
    upcomingExceptions: number;
  }> {
    try {
      const schedules = await this.getClassSchedules(classId);
      const today = new Date().toISOString().split('T')[0];
      
      const stats = {
        totalSchedules: schedules.length,
        schedulesByDay: {
          Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0,
          Thursday: 0, Friday: 0, Saturday: 0
        },
        totalExceptions: 0,
        upcomingExceptions: 0,
      };

      schedules.forEach(schedule => {
        const dayName = this.getDayName(schedule.dayOfWeek);
        if (dayName in stats.schedulesByDay) {
          stats.schedulesByDay[dayName as keyof typeof stats.schedulesByDay]++;
        }
        
        stats.totalExceptions += schedule.exceptions.length;
        stats.upcomingExceptions += schedule.exceptions.filter(exc => exc.date >= today).length;
      });

      return stats;
    } catch (error) {
      throw new DatabaseError('Failed to get schedule statistics', error);
    }
  }

  /**
   * Detect conflicts within bulk schedule creation
   */
  private detectBulkConflicts(currentSchedule: CreateScheduleData, previousSchedules: CreateScheduleData[]): string[] {
    const conflicts: string[] = [];

    for (let i = 0; i < previousSchedules.length; i++) {
      const existingSchedule = previousSchedules[i];
      
      if (currentSchedule.classId === existingSchedule.classId && 
          currentSchedule.dayOfWeek === existingSchedule.dayOfWeek &&
          this.isTimeOverlapping(
            currentSchedule.startTime,
            currentSchedule.endTime,
            existingSchedule.startTime,
            existingSchedule.endTime
          )) {
        conflicts.push(`Conflicts with schedule ${i + 1} in this bulk operation`);
      }
    }

    return conflicts;
  }

  /**
   * Get day name from day number
   */
  private getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
  }
}

export default new ScheduleService();