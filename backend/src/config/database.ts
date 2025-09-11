import { PrismaClient } from '@prisma/client'

// Global variable to store the Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined
}

// Create a singleton Prisma client instance
export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// In development, store the client in a global variable to prevent multiple instances
if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma
}

// Graceful shutdown handler
export async function disconnectDatabase() {
  await prisma.$disconnect()
}

// Database health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// Export Prisma types for use in other files
export type {
  User,
  Student,
  Class,
  ClassEnrollment,
  Schedule,
  ScheduleException,
  Meeting,
  AttendanceRecord,
  AttendanceEntry,
  ClassNote,
  Test,
  TestResult,
  HomeworkAssignment,
  HomeworkSubmission,
  UserRole,
  ParticipantType,
  MeetingType,
  MeetingStatus,
  AttendanceStatus,
  TestType,
  SubmissionStatus
} from '@prisma/client'