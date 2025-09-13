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
   * Get all schedules for a class
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
   * Get day name from day number
   */
  private getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
  }
}

export default new ScheduleService();