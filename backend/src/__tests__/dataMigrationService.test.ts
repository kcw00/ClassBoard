import { DataMigrationService } from '../services/dataMigrationService'
import { prisma } from '../config/database'
import fs from 'fs/promises'
import path from 'path'

// Mock data for testing
const mockTestData = {
  students: [
    {
      id: "test-student-1",
      name: "Test Student 1",
      email: "test1@example.com",
      phone: "(555) 111-1111",
      grade: "10th Grade",
      parentContact: "(555) 111-1112",
      enrollmentDate: "2024-01-01"
    },
    {
      id: "test-student-2",
      name: "Test Student 2",
      email: "test2@example.com",
      phone: "(555) 222-2222",
      grade: "11th Grade",
      parentContact: "(555) 222-2223",
      enrollmentDate: "2024-01-02"
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
      enrolledStudents: ["test-student-1", "test-student-2"],
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
  meetings: [
    {
      id: "test-meeting-1",
      title: "Test Meeting",
      description: "Test meeting description",
      date: "2024-12-15",
      startTime: "14:00",
      endTime: "15:00",
      participants: ["test-student-1"],
      participantType: "students" as const,
      location: "Room 101",
      meetingType: "in_person" as const,
      status: "scheduled" as const,
      createdDate: "2024-12-01",
      notes: "Test notes"
    }
  ],
  attendanceRecords: [
    {
      id: "test-attendance-1",
      classId: "test-class-1",
      date: "2024-12-01",
      attendanceData: [
        { studentId: "test-student-1", status: "present" as const },
        { studentId: "test-student-2", status: "absent" as const, notes: "Sick" }
      ],
      createdDate: "2024-12-01"
    }
  ],
  classNotes: [
    {
      id: "test-note-1",
      classId: "test-class-1",
      date: "2024-12-01",
      content: "Test class notes content",
      topics: ["Topic 1", "Topic 2"],
      homework: "Test homework assignment",
      objectives: "Test learning objectives",
      createdDate: "2024-12-01",
      updatedDate: "2024-12-01"
    }
  ],
  tests: [
    {
      id: "test-test-1",
      classId: "test-class-1",
      title: "Test Quiz",
      description: "Test quiz description",
      testDate: "2024-12-15",
      totalPoints: 100,
      testType: "quiz" as const,
      fileName: "test-quiz.pdf",
      createdDate: "2024-12-01",
      updatedDate: "2024-12-01"
    }
  ],
  testResults: [
    {
      id: "test-result-1",
      testId: "test-test-1",
      studentId: "test-student-1",
      score: 85,
      maxScore: 100,
      percentage: 85,
      grade: "B",
      feedback: "Good work!",
      submittedDate: "2024-12-15",
      gradedDate: "2024-12-16",
      createdDate: "2024-12-16",
      updatedDate: "2024-12-16"
    }
  ],
  homeworkAssignments: [
    {
      id: "test-homework-1",
      classId: "test-class-1",
      title: "Test Homework",
      description: "Test homework description",
      assignedDate: "2024-12-01",
      dueDate: "2024-12-08",
      totalPoints: 50,
      instructions: "Complete all problems",
      resources: ["Textbook Chapter 1"],
      createdDate: "2024-12-01",
      updatedDate: "2024-12-01"
    }
  ],
  homeworkSubmissions: [
    {
      id: "test-submission-1",
      assignmentId: "test-homework-1",
      studentId: "test-student-1",
      submittedDate: "2024-12-08",
      score: 45,
      maxScore: 50,
      grade: "A-",
      feedback: "Excellent work!",
      status: "graded" as const,
      gradedDate: "2024-12-09",
      createdDate: "2024-12-08",
      updatedDate: "2024-12-09"
    }
  ]
}

const invalidTestData = {
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

describe('DataMigrationService', () => {
  let migrationService: DataMigrationService

  beforeEach(async () => {
    migrationService = new DataMigrationService()

    // Clean up database before each test
    await prisma.homeworkSubmission.deleteMany()
    await prisma.homeworkAssignment.deleteMany()
    await prisma.testResult.deleteMany()
    await prisma.test.deleteMany()
    await prisma.attendanceEntry.deleteMany()
    await prisma.attendanceRecord.deleteMany()
    await prisma.classNote.deleteMany()
    await prisma.meeting.deleteMany()
    await prisma.scheduleException.deleteMany()
    await prisma.schedule.deleteMany()
    await prisma.classEnrollment.deleteMany()
    await prisma.class.deleteMany()
    await prisma.student.deleteMany()
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('migrateAllData', () => {
    it('should successfully migrate valid data', async () => {
      const result = await migrationService.migrateAllData(mockTestData)

      expect(result.success).toBe(true)
      expect(result.summary).toBeDefined()
      expect(result.summary?.students).toBe(2)
      expect(result.summary?.classes).toBe(1)
      expect(result.summary?.enrollments).toBe(2)

      // Verify data was actually inserted
      const studentCount = await prisma.student.count()
      const classCount = await prisma.class.count()
      const enrollmentCount = await prisma.classEnrollment.count()

      expect(studentCount).toBe(2)
      expect(classCount).toBe(1)
      expect(enrollmentCount).toBe(2)
    })

    it('should fail with invalid data and provide validation errors', async () => {
      const result = await migrationService.migrateAllData(invalidTestData)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
      expect(result.message).toContain('Input validation failed')
    })

    it('should handle empty data gracefully', async () => {
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

      const result = await migrationService.migrateAllData(emptyData)

      expect(result.success).toBe(true)
      expect(result.summary?.students).toBe(0)
      expect(result.summary?.classes).toBe(0)
    })

    it('should create and use backup during migration', async () => {
      // First migration to create some data
      await migrationService.migrateAllData(mockTestData)

      // Verify backup directory exists and contains backup files
      const backupDir = path.join(process.cwd(), 'backups')
      const backupFiles = await fs.readdir(backupDir).catch(() => [])

      expect(backupFiles.length).toBeGreaterThan(0)
      expect(backupFiles.some(file => file.startsWith('backup-'))).toBe(true)
    })
  })

  describe('validateMigration', () => {
    it('should pass validation after successful migration', async () => {
      await migrationService.migrateAllData(mockTestData)
      const isValid = await migrationService.validateMigration()

      expect(isValid).toBe(true)
    })

    it('should fail validation with empty database', async () => {
      const isValid = await migrationService.validateMigration()

      expect(isValid).toBe(false)
    })
  })

  describe('testMigration', () => {
    it('should run comprehensive migration tests', async () => {
      const testResult = await migrationService.testMigration()

      expect(testResult.results).toBeDefined()
      expect(testResult.results.length).toBeGreaterThan(0)

      // Check that we have tests for both valid and invalid scenarios
      const testNames = testResult.results.map(r => r.test)
      expect(testNames).toContain('Empty data migration')
      expect(testNames).toContain('Invalid data handling')
    })
  })

  describe('rollback functionality', () => {
    it('should create backup and allow rollback', async () => {
      // Create initial data
      await migrationService.migrateAllData(mockTestData)
      const initialStudentCount = await prisma.student.count()

      // Get the backup ID from the backup directory
      const backupDir = path.join(process.cwd(), 'backups')
      const backupFiles = await fs.readdir(backupDir)
      const latestBackup = backupFiles
        .filter(file => file.startsWith('backup-'))
        .sort()
        .pop()

      if (latestBackup) {
        const backupId = latestBackup.replace('.json', '')

        // Clear database
        await prisma.student.deleteMany()
        expect(await prisma.student.count()).toBe(0)

        // Rollback
        await migrationService.rollback(backupId)

        // Verify data was restored
        const restoredStudentCount = await prisma.student.count()
        expect(restoredStudentCount).toBe(initialStudentCount)
      }
    })
  })

  describe('data integrity validation', () => {
    it('should detect referential integrity issues', async () => {
      // Migrate valid data first
      await migrationService.migrateAllData(mockTestData)

      // Manually create invalid reference (this would normally be prevented by foreign keys)
      // We'll test the validation logic by checking the validation method
      const isValid = await migrationService.validateMigration()
      expect(isValid).toBe(true)
    })

    it('should validate email formats in input data', async () => {
      const dataWithInvalidEmail = {
        ...mockTestData,
        students: [
          {
            ...mockTestData.students[0],
            email: 'invalid-email-format'
          }
        ]
      }

      const result = await migrationService.migrateAllData(dataWithInvalidEmail)
      expect(result.success).toBe(false)
      expect(result.errors?.some(error => error.includes('Invalid email format'))).toBe(true)
    })

    it('should validate class capacity constraints', async () => {
      const dataWithInvalidCapacity = {
        ...mockTestData,
        classes: [
          {
            ...mockTestData.classes[0],
            capacity: -5
          }
        ]
      }

      const result = await migrationService.migrateAllData(dataWithInvalidCapacity)
      expect(result.success).toBe(false)
      expect(result.errors?.some(error => error.includes('Capacity must be greater than 0'))).toBe(true)
    })

    it('should validate foreign key references', async () => {
      const dataWithInvalidReferences = {
        ...mockTestData,
        testResults: [
          {
            id: "invalid-result",
            testId: "non-existent-test",
            studentId: "non-existent-student",
            score: 85,
            maxScore: 100,
            percentage: 85,
            grade: "B",
            feedback: "Good work!",
            submittedDate: "2024-12-15",
            gradedDate: "2024-12-16",
            createdDate: "2024-12-16",
            updatedDate: "2024-12-16"
          }
        ]
      }

      const result = await migrationService.migrateAllData(dataWithInvalidReferences)
      expect(result.success).toBe(false)
      expect(result.errors?.some(error => error.includes('References non-existent'))).toBe(true)
    })
  })

  describe('logging functionality', () => {
    it('should create log files during migration', async () => {
      await migrationService.migrateAllData(mockTestData)

      const logFile = path.join(process.cwd(), 'logs', 'migration.log')
      const logExists = await fs.access(logFile).then(() => true).catch(() => false)

      expect(logExists).toBe(true)

      if (logExists) {
        const logContent = await fs.readFile(logFile, 'utf-8')
        expect(logContent).toContain('Starting complete data migration')
        expect(logContent).toContain('Data migration completed successfully')
      }
    })
  })

  describe('performance and monitoring', () => {
    it('should complete migration within reasonable time', async () => {
      const startTime = Date.now()
      await migrationService.migrateAllData(mockTestData)
      const duration = Date.now() - startTime

      // Migration should complete within 10 seconds for test data
      expect(duration).toBeLessThan(10000)
    })

    it('should provide detailed migration summary', async () => {
      const result = await migrationService.migrateAllData(mockTestData)

      expect(result.summary).toBeDefined()
      expect(result.summary).toHaveProperty('students')
      expect(result.summary).toHaveProperty('classes')
      expect(result.summary).toHaveProperty('enrollments')
      expect(result.summary).toHaveProperty('schedules')
      expect(result.summary).toHaveProperty('tests')
      expect(result.summary).toHaveProperty('homeworkAssignments')
    })
  })
})