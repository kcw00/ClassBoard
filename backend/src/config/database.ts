import { PrismaClient } from '@prisma/client'

// Global variable to store the Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined
}

// Create a singleton Prisma client instance with optimized configuration
export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool configuration for better performance
  // These settings are passed to the underlying database driver
})

// Configure connection pool settings via environment variables
// These should be set in your .env file:
// DATABASE_CONNECTION_LIMIT=10
// DATABASE_POOL_TIMEOUT=20000
// DATABASE_POOL_MIN=2
// DATABASE_POOL_MAX=10
// DATABASE_POOL_IDLE_TIMEOUT=30000

// Connection pool configuration
export const connectionPoolConfig = {
  connectionLimit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '10'),
  poolTimeout: parseInt(process.env.DATABASE_POOL_TIMEOUT || '20000'),
  acquireTimeout: parseInt(process.env.DATABASE_ACQUIRE_TIMEOUT || '60000'),
  timeout: parseInt(process.env.DATABASE_TIMEOUT || '60000'),
  reconnect: true,
  reconnectTries: 3,
  reconnectInterval: 1000,
};

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