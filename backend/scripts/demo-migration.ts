#!/usr/bin/env tsx

/**
 * Demo script to showcase the data migration service functionality
 * This script demonstrates validation, logging, and error handling without requiring a database
 */

import { DataMigrationService } from '../src/services/dataMigrationService'

// Sample valid data
const validSampleData = {
  students: [
    {
      id: "demo-student-1",
      name: "Alice Johnson",
      email: "alice.johnson@example.com",
      phone: "(555) 123-4567",
      grade: "10th Grade",
      parentContact: "(555) 123-4568",
      enrollmentDate: "2024-08-15"
    },
    {
      id: "demo-student-2",
      name: "Bob Smith",
      email: "bob.smith@example.com",
      phone: "(555) 234-5678",
      grade: "11th Grade",
      parentContact: "(555) 234-5679",
      enrollmentDate: "2024-08-16"
    }
  ],
  classes: [
    {
      id: "demo-class-1",
      name: "Algebra II",
      subject: "Mathematics",
      description: "Advanced algebra concepts",
      room: "Math 101",
      capacity: 25,
      enrolledStudents: ["demo-student-1", "demo-student-2"],
      createdDate: "2024-08-01",
      color: "#3b82f6"
    }
  ],
  schedules: [
    {
      id: "demo-schedule-1",
      classId: "demo-class-1",
      dayOfWeek: 1, // Monday
      startTime: "09:00",
      endTime: "10:30"
    },
    {
      id: "demo-schedule-2",
      classId: "demo-class-1",
      dayOfWeek: 3, // Wednesday
      startTime: "09:00",
      endTime: "10:30"
    }
  ],
  scheduleExceptions: [],
  meetings: [
    {
      id: "demo-meeting-1",
      title: "Parent-Teacher Conference",
      description: "Discuss student progress",
      date: "2024-12-15",
      startTime: "14:00",
      endTime: "15:00",
      participants: ["demo-student-1"],
      participantType: "parents" as const,
      location: "Classroom 101",
      meetingType: "in_person" as const,
      status: "scheduled" as const,
      createdDate: "2024-12-01",
      notes: "Discuss math progress"
    }
  ],
  attendanceRecords: [
    {
      id: "demo-attendance-1",
      classId: "demo-class-1",
      date: "2024-12-02",
      attendanceData: [
        { studentId: "demo-student-1", status: "present" as const },
        { studentId: "demo-student-2", status: "late" as const, notes: "Traffic delay" }
      ],
      createdDate: "2024-12-02"
    }
  ],
  classNotes: [
    {
      id: "demo-note-1",
      classId: "demo-class-1",
      date: "2024-12-02",
      content: "Covered quadratic equations and factoring methods",
      topics: ["Quadratic equations", "Factoring", "Graphing"],
      homework: "Complete practice problems 1-20",
      objectives: "Students will factor quadratic expressions",
      createdDate: "2024-12-02",
      updatedDate: "2024-12-02"
    }
  ],
  tests: [
    {
      id: "demo-test-1",
      classId: "demo-class-1",
      title: "Quadratic Equations Quiz",
      description: "Quiz on solving quadratic equations",
      testDate: "2024-12-10",
      totalPoints: 50,
      testType: "quiz" as const,
      createdDate: "2024-12-01",
      updatedDate: "2024-12-01"
    }
  ],
  testResults: [
    {
      id: "demo-result-1",
      testId: "demo-test-1",
      studentId: "demo-student-1",
      score: 45,
      maxScore: 50,
      percentage: 90,
      grade: "A-",
      feedback: "Excellent work!",
      submittedDate: "2024-12-10",
      gradedDate: "2024-12-11",
      createdDate: "2024-12-11",
      updatedDate: "2024-12-11"
    }
  ],
  homeworkAssignments: [
    {
      id: "demo-homework-1",
      classId: "demo-class-1",
      title: "Factoring Practice",
      description: "Practice factoring quadratic expressions",
      assignedDate: "2024-12-01",
      dueDate: "2024-12-08",
      totalPoints: 25,
      instructions: "Complete all problems showing work",
      resources: ["Textbook Chapter 4", "Online calculator"],
      createdDate: "2024-12-01",
      updatedDate: "2024-12-01"
    }
  ],
  homeworkSubmissions: [
    {
      id: "demo-submission-1",
      assignmentId: "demo-homework-1",
      studentId: "demo-student-1",
      submittedDate: "2024-12-08",
      score: 23,
      maxScore: 25,
      grade: "A-",
      feedback: "Great work! Minor error on problem 8",
      status: "graded" as const,
      gradedDate: "2024-12-09",
      createdDate: "2024-12-08",
      updatedDate: "2024-12-09"
    }
  ]
}

// Sample invalid data for testing validation
const invalidSampleData = {
  students: [
    {
      id: "",
      name: "",
      email: "invalid-email-format",
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
      capacity: -5, // Invalid capacity
      enrolledStudents: [],
      createdDate: "",
      color: ""
    }
  ],
  schedules: [
    {
      id: "invalid-schedule",
      classId: "non-existent-class", // Invalid reference
      dayOfWeek: 10, // Invalid day (should be 0-6)
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

async function demonstrateValidation() {
  console.log('🔍 Demonstrating Data Validation...\n')

  const migrationService = new DataMigrationService()

  // Test valid data validation
  console.log('✅ Testing valid data validation:')
  try {
    // Access private method for demonstration
    const validateInputData = (migrationService as any).validateInputData.bind(migrationService)
    const validErrors = await validateInputData(validSampleData)

    if (validErrors.length === 0) {
      console.log('   ✓ Valid data passed validation with no errors')
    } else {
      console.log(`   ❌ Unexpected errors found: ${validErrors.length}`)
    }
  } catch (error) {
    console.log(`   ❌ Validation failed: ${error}`)
  }

  console.log()

  // Test invalid data validation
  console.log('❌ Testing invalid data validation:')
  try {
    const validateInputData = (migrationService as any).validateInputData.bind(migrationService)
    const invalidErrors = await validateInputData(invalidSampleData)

    console.log(`   Found ${invalidErrors.length} validation errors:`)
    invalidErrors.forEach((error: any, index: number) => {
      console.log(`   ${index + 1}. ${error.entity}[${error.id}].${error.field}: ${error.message}`)
    })
  } catch (error) {
    console.log(`   ❌ Validation failed: ${error}`)
  }

  console.log()
}

async function demonstrateEmailValidation() {
  console.log('📧 Demonstrating Email Validation...\n')

  const migrationService = new DataMigrationService()
  const isValidEmail = (migrationService as any).isValidEmail.bind(migrationService)

  const testEmails = [
    'valid@example.com',
    'user.name@domain.co.uk',
    'test+tag@example.org',
    'invalid-email',
    '@example.com',
    'test@',
    'test.example.com',
    ''
  ]

  testEmails.forEach(email => {
    const isValid = isValidEmail(email)
    const status = isValid ? '✓' : '❌'
    console.log(`   ${status} ${email || '(empty)'}: ${isValid ? 'Valid' : 'Invalid'}`)
  })

  console.log()
}

async function demonstrateChecksumGeneration() {
  console.log('🔐 Demonstrating Checksum Generation...\n')

  const migrationService = new DataMigrationService()
  const generateChecksum = (migrationService as any).generateChecksum.bind(migrationService)

  const testData1 = JSON.stringify({ test: 'data', number: 123 })
  const testData2 = JSON.stringify({ test: 'data', number: 124 })

  const checksum1a = generateChecksum(testData1)
  const checksum1b = generateChecksum(testData1)
  const checksum2 = generateChecksum(testData2)

  console.log('   Testing checksum consistency:')
  console.log(`   Data 1 (first):  ${checksum1a}`)
  console.log(`   Data 1 (second): ${checksum1b}`)
  console.log(`   Same data produces same checksum: ${checksum1a === checksum1b ? '✓' : '❌'}`)

  console.log()
  console.log('   Testing checksum uniqueness:')
  console.log(`   Data 1: ${checksum1a}`)
  console.log(`   Data 2: ${checksum2}`)
  console.log(`   Different data produces different checksums: ${checksum1a !== checksum2 ? '✓' : '❌'}`)

  console.log()
}

async function demonstrateDataStructureAnalysis() {
  console.log('📊 Demonstrating Data Structure Analysis...\n')

  console.log('   Sample data contains:')
  console.log(`   - ${validSampleData.students.length} students`)
  console.log(`   - ${validSampleData.classes.length} classes`)
  console.log(`   - ${validSampleData.schedules.length} schedules`)
  console.log(`   - ${validSampleData.meetings.length} meetings`)
  console.log(`   - ${validSampleData.attendanceRecords.length} attendance records`)
  console.log(`   - ${validSampleData.classNotes.length} class notes`)
  console.log(`   - ${validSampleData.tests.length} tests`)
  console.log(`   - ${validSampleData.testResults.length} test results`)
  console.log(`   - ${validSampleData.homeworkAssignments.length} homework assignments`)
  console.log(`   - ${validSampleData.homeworkSubmissions.length} homework submissions`)

  console.log()

  // Calculate relationships
  const totalEnrollments = validSampleData.classes.reduce((sum, cls) => sum + cls.enrolledStudents.length, 0)
  const totalAttendanceEntries = validSampleData.attendanceRecords.reduce((sum, record) => sum + record.attendanceData.length, 0)

  console.log('   Calculated relationships:')
  console.log(`   - ${totalEnrollments} total class enrollments`)
  console.log(`   - ${totalAttendanceEntries} total attendance entries`)

  console.log()
}

async function demonstrateLogging() {
  console.log('📝 Demonstrating Logging Functionality...\n')

  const migrationService = new DataMigrationService()

  try {
    // Initialize logging
    const initializeLogging = (migrationService as any).initializeLogging.bind(migrationService)
    await initializeLogging()
    console.log('   ✓ Logging system initialized')

    // Test logging
    const log = (migrationService as any).log.bind(migrationService)
    await log('Demo: Testing log message')
    console.log('   ✓ Log message written successfully')

    await log('Demo: Testing another log message with timestamp')
    console.log('   ✓ Multiple log messages handled correctly')

  } catch (error) {
    console.log(`   ❌ Logging failed: ${error}`)
  }

  console.log()
}

async function main() {
  console.log('🚀 Data Migration Service Demonstration\n')
  console.log('This demo showcases the migration service functionality without requiring a database connection.\n')

  try {
    await demonstrateValidation()
    await demonstrateEmailValidation()
    await demonstrateChecksumGeneration()
    await demonstrateDataStructureAnalysis()
    await demonstrateLogging()

    console.log('🎉 Demo completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Configure database connection in .env file')
    console.log('2. Run database migrations: npm run db:migrate')
    console.log('3. Execute full migration: npm run db:migrate-data')
    console.log('4. Run comprehensive tests: npm run migration:test')

  } catch (error) {
    console.error('❌ Demo failed:', error)
    process.exit(1)
  }
}

// Run the demo if this script is executed directly
if (require.main === module) {
  main()
}

export { main as runDemo }