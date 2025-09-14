import { DataMigrationService } from '../services/dataMigrationService'

// Mock Prisma to avoid database connection issues in tests
jest.mock('../config/database', () => ({
  prisma: {
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    user: { count: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
    student: { count: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
    class: { count: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
    classEnrollment: { count: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
    schedule: { count: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
    scheduleException: { deleteMany: jest.fn() },
    meeting: { deleteMany: jest.fn() },
    attendanceRecord: { deleteMany: jest.fn() },
    attendanceEntry: { deleteMany: jest.fn() },
    classNote: { deleteMany: jest.fn() },
    test: { count: jest.fn(), deleteMany: jest.fn() },
    testResult: { deleteMany: jest.fn() },
    homeworkAssignment: { count: jest.fn(), deleteMany: jest.fn() },
    homeworkSubmission: { deleteMany: jest.fn() },
    $disconnect: jest.fn()
  }
}))

// Mock fs operations to avoid file system dependencies
jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue('{"timestamp":"2024-12-14","data":{},"checksum":"abc123"}'),
  appendFile: jest.fn().mockResolvedValue(undefined),
  readdir: jest.fn().mockResolvedValue(['backup-2024-12-14.json']),
  access: jest.fn().mockResolvedValue(undefined)
}))

// Valid test data
const validMockData = {
  students: [
    {
      id: "test-student-1",
      name: "Test Student 1",
      email: "test1@example.com",
      phone: "(555) 111-1111",
      grade: "10th Grade",
      parentContact: "(555) 111-1112",
      enrollmentDate: "2024-01-01"
    }
  ],
  classes: [
    {
      id: "test-class-1",
      name: "Test Math Class",
      subject: "Mathematics",
      description: "Test math class description",
      room: "Room 101",
      capacity: 20,
      enrolledStudents: ["test-student-1"],
      createdDate: "2024-01-01",
      color: "#3b82f6"
    }
  ],
  schedules: [
    {
      id: "test-schedule-1",
      classId: "test-class-1",
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "10:30"
    }
  ],
  scheduleExceptions: [],
  meetings: [],
  attendanceRecords: [],
  classNotes: [],
  tests: [],
  testResults: [],
  homeworkAssignments: [],
  homeworkSubmissions: []
}

// Invalid test data
const invalidMockData = {
  students: [
    {
      id: "",
      name: "",
      email: "invalid-email",
      phone: "",
      grade: "",
      parentContact: "",
      enrollmentDate: ""
    }
  ],
  classes: [
    {
      id: "",
      name: "",
      subject: "",
      description: "",
      room: "",
      capacity: -1,
      enrolledStudents: [],
      createdDate: "",
      color: ""
    }
  ],
  schedules: [
    {
      id: "invalid-schedule",
      classId: "non-existent-class",
      dayOfWeek: 10, // Invalid day
      startTime: "25:00", // Invalid time
      endTime: "26:00"
    }
  ],
  scheduleExceptions: [],
  meetings: [],
  attendanceRecords: [],
  classNotes: [],
  tests: [],
  testResults: [],
  homeworkAssignments: [],
  homeworkSubmissions: []
}

describe('DataMigrationService - Validation Tests', () => {
  let migrationService: DataMigrationService

  beforeEach(() => {
    migrationService = new DataMigrationService()
    jest.clearAllMocks()
  })

  describe('Input Data Validation', () => {
    it('should validate valid student data', async () => {
      // Access the private method through type assertion for testing
      const validateInputData = (migrationService as any).validateInputData.bind(migrationService)
      const errors = await validateInputData(validMockData)

      expect(errors).toHaveLength(0)
    })

    it('should detect missing required fields in students', async () => {
      const validateInputData = (migrationService as any).validateInputData.bind(migrationService)
      const errors = await validateInputData(invalidMockData)

      const studentErrors = errors.filter((e: any) => e.entity === 'student')
      expect(studentErrors.length).toBeGreaterThan(0)
      expect(studentErrors.some((e: any) => e.message.includes('Missing required fields'))).toBe(true)
    })

    it('should detect invalid email formats', async () => {
      const validateInputData = (migrationService as any).validateInputData.bind(migrationService)
      const errors = await validateInputData(invalidMockData)

      const emailErrors = errors.filter((e: any) => e.field === 'email')
      expect(emailErrors.length).toBeGreaterThan(0)
      expect(emailErrors.some((e: any) => e.message.includes('Invalid email format'))).toBe(true)
    })

    it('should detect invalid class capacity', async () => {
      const validateInputData = (migrationService as any).validateInputData.bind(migrationService)
      const errors = await validateInputData(invalidMockData)

      const capacityErrors = errors.filter((e: any) => e.field === 'capacity')
      expect(capacityErrors.length).toBeGreaterThan(0)
      expect(capacityErrors.some((e: any) => e.message.includes('Capacity must be greater than 0'))).toBe(true)
    })

    it('should detect invalid schedule day of week', async () => {
      const validateInputData = (migrationService as any).validateInputData.bind(migrationService)
      const errors = await validateInputData(invalidMockData)

      const dayErrors = errors.filter((e: any) => e.field === 'dayOfWeek')
      expect(dayErrors.length).toBeGreaterThan(0)
      expect(dayErrors.some((e: any) => e.message.includes('Day of week must be between 0-6'))).toBe(true)
    })

    it('should detect invalid foreign key references', async () => {
      const validateInputData = (migrationService as any).validateInputData.bind(migrationService)
      const errors = await validateInputData(invalidMockData)

      const referenceErrors = errors.filter((e: any) => e.field === 'classId')
      expect(referenceErrors.length).toBeGreaterThan(0)
      expect(referenceErrors.some((e: any) => e.message.includes('References non-existent class'))).toBe(true)
    })
  })

  describe('Email Validation Helper', () => {
    it('should validate correct email formats', () => {
      const isValidEmail = (migrationService as any).isValidEmail.bind(migrationService)
      
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
      expect(isValidEmail('test+tag@example.org')).toBe(true)
    })

    it('should reject invalid email formats', () => {
      const isValidEmail = (migrationService as any).isValidEmail.bind(migrationService)
      
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('test.example.com')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('Checksum Generation', () => {
    it('should generate consistent checksums for same data', () => {
      const generateChecksum = (migrationService as any).generateChecksum.bind(migrationService)
      
      const data = JSON.stringify({ test: 'data' })
      const checksum1 = generateChecksum(data)
      const checksum2 = generateChecksum(data)
      
      expect(checksum1).toBe(checksum2)
      expect(typeof checksum1).toBe('string')
      expect(checksum1.length).toBeGreaterThan(0)
    })

    it('should generate different checksums for different data', () => {
      const generateChecksum = (migrationService as any).generateChecksum.bind(migrationService)
      
      const data1 = JSON.stringify({ test: 'data1' })
      const data2 = JSON.stringify({ test: 'data2' })
      const checksum1 = generateChecksum(data1)
      const checksum2 = generateChecksum(data2)
      
      expect(checksum1).not.toBe(checksum2)
    })
  })

  describe('Logging Functionality', () => {
    it('should initialize logging without errors', async () => {
      const initializeLogging = (migrationService as any).initializeLogging.bind(migrationService)
      
      await expect(initializeLogging()).resolves.not.toThrow()
    })

    it('should log messages without errors', async () => {
      const log = (migrationService as any).log.bind(migrationService)
      
      await expect(log('Test message')).resolves.not.toThrow()
    })
  })

  describe('Data Structure Validation', () => {
    it('should accept complete valid mock data structure', async () => {
      const validateInputData = (migrationService as any).validateInputData.bind(migrationService)
      
      const completeValidData = {
        ...validMockData,
        tests: [
          {
            id: "test-1",
            classId: "test-class-1",
            title: "Test Quiz",
            description: "Test description",
            testDate: "2024-12-15",
            totalPoints: 100,
            testType: "quiz",
            createdDate: "2024-12-01",
            updatedDate: "2024-12-01"
          }
        ],
        testResults: [
          {
            id: "result-1",
            testId: "test-1",
            studentId: "test-student-1",
            score: 85,
            maxScore: 100,
            percentage: 85,
            grade: "B",
            gradedDate: "2024-12-16",
            createdDate: "2024-12-16",
            updatedDate: "2024-12-16"
          }
        ]
      }

      const errors = await validateInputData(completeValidData)
      expect(errors).toHaveLength(0)
    })

    it('should detect missing entity relationships', async () => {
      const validateInputData = (migrationService as any).validateInputData.bind(migrationService)
      
      const dataWithMissingReferences = {
        ...validMockData,
        testResults: [
          {
            id: "result-1",
            testId: "non-existent-test",
            studentId: "non-existent-student",
            score: 85,
            maxScore: 100,
            percentage: 85,
            grade: "B",
            gradedDate: "2024-12-16",
            createdDate: "2024-12-16",
            updatedDate: "2024-12-16"
          }
        ]
      }

      const errors = await validateInputData(dataWithMissingReferences)
      expect(errors.length).toBeGreaterThan(0)
      
      const testIdErrors = errors.filter((e: any) => e.field === 'testId')
      const studentIdErrors = errors.filter((e: any) => e.field === 'studentId')
      
      expect(testIdErrors.length).toBeGreaterThan(0)
      expect(studentIdErrors.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty data arrays', async () => {
      const validateInputData = (migrationService as any).validateInputData.bind(migrationService)
      
      const emptyData = {
        students: [],
        classes: [],
        schedules: [],
        scheduleExceptions: [],
        meetings: [],
        attendanceRecords: [],
        classNotes: [],
        tests: [],
        testResults: [],
        homeworkAssignments: [],
        homeworkSubmissions: []
      }

      const errors = await validateInputData(emptyData)
      expect(errors).toHaveLength(0)
    })

    it('should handle null and undefined values gracefully', async () => {
      const validateInputData = (migrationService as any).validateInputData.bind(migrationService)
      
      const dataWithNulls = {
        students: [
          {
            id: "test-1",
            name: "Test Student",
            email: "test@example.com",
            phone: null,
            grade: "10th Grade",
            parentContact: undefined,
            enrollmentDate: "2024-01-01"
          }
        ],
        classes: [],
        schedules: [],
        scheduleExceptions: [],
        meetings: [],
        attendanceRecords: [],
        classNotes: [],
        tests: [],
        testResults: [],
        homeworkAssignments: [],
        homeworkSubmissions: []
      }

      // Should not throw errors for null/undefined optional fields
      await expect(validateInputData(dataWithNulls)).resolves.not.toThrow()
    })
  })
})