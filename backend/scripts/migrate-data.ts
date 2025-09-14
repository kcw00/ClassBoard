#!/usr/bin/env tsx

import { DataMigrationService } from '../src/services/dataMigrationService'
import { prisma } from '../src/config/database'
import fs from 'fs/promises'
import path from 'path'

/**
 * Load mock data from the frontend source
 */
async function loadMockDataFromFrontend() {
  try {
    // Try to read the actual mock data file from the frontend
    const mockDataPath = path.join(process.cwd(), '..', 'src', 'data', 'mockData.ts')
    
    // For now, we'll use a comprehensive mock data set that matches the frontend structure
    // In a real scenario, you might want to parse the TypeScript file or have a JSON export
    return {
  students: [
    {
      id: "1",
      name: "Alice Johnson",
      email: "alice.johnson@email.com",
      phone: "(555) 123-4567",
      grade: "10th Grade",
      parentContact: "(555) 123-4568",
      enrollmentDate: "2024-08-15"
    },
    {
      id: "2",
      name: "Bob Smith",
      email: "bob.smith@email.com",
      phone: "(555) 234-5678",
      grade: "11th Grade",
      parentContact: "(555) 234-5679",
      enrollmentDate: "2024-08-16"
    },
    {
      id: "3",
      name: "Carol Davis",
      email: "carol.davis@email.com",
      phone: "(555) 345-6789",
      grade: "10th Grade",
      parentContact: "(555) 345-6790",
      enrollmentDate: "2024-08-17"
    }
  ],
  classes: [
    {
      id: "1",
      name: "Algebra II",
      subject: "Mathematics",
      description: "Advanced algebra concepts including polynomials, logarithms, and trigonometry",
      room: "Math 101",
      capacity: 25,
      enrolledStudents: ["1", "3"],
      createdDate: "2024-08-01",
      color: "#3b82f6"
    },
    {
      id: "2",
      name: "Chemistry Fundamentals",
      subject: "Science",
      description: "Introduction to chemical principles, reactions, and laboratory techniques",
      room: "Science 205",
      capacity: 20,
      enrolledStudents: ["2"],
      createdDate: "2024-08-02",
      color: "#10b981"
    }
  ],
  schedules: [
    { id: "1", classId: "1", dayOfWeek: 1, startTime: "09:00", endTime: "10:30" },
    { id: "2", classId: "1", dayOfWeek: 3, startTime: "09:00", endTime: "10:30" },
    { id: "3", classId: "2", dayOfWeek: 2, startTime: "11:00", endTime: "12:30" }
  ],
  scheduleExceptions: [],
  meetings: [
    {
      id: "1",
      title: "Parent-Teacher Conference - Alice Johnson",
      description: "Discuss Alice's progress in mathematics",
      date: "2024-12-10",
      startTime: "14:00",
      endTime: "14:30",
      participants: ["1"],
      participantType: "parents" as const,
      location: "Classroom Math 101",
      meetingType: "in-person" as const,
      status: "scheduled" as const,
      createdDate: "2024-12-01",
      notes: "Focus on algebra concepts"
    }
  ],
  attendanceRecords: [
    {
      id: "1",
      classId: "1",
      date: "2024-12-02",
      attendanceData: [
        { studentId: "1", status: "present" as const },
        { studentId: "3", status: "late" as const, notes: "Arrived 10 minutes late" }
      ],
      createdDate: "2024-12-02"
    }
  ],
  classNotes: [
    {
      id: "1",
      classId: "1",
      date: "2024-12-02",
      content: "Covered quadratic equations and factoring methods",
      topics: ["Quadratic equations", "Factoring"],
      homework: "Complete problems 1-20 on page 145",
      objectives: "Students will be able to factor quadratic expressions",
      createdDate: "2024-12-02",
      updatedDate: "2024-12-02"
    }
  ],
  tests: [
    {
      id: "1",
      classId: "1",
      title: "Quadratic Equations Test",
      description: "Comprehensive test covering quadratic equations",
      testDate: "2024-12-10",
      totalPoints: 100,
      testType: "exam" as const,
      fileName: "algebra_test.pdf",
      createdDate: "2024-12-01",
      updatedDate: "2024-12-01"
    }
  ],
  testResults: [
    {
      id: "1",
      testId: "1",
      studentId: "1",
      score: 88,
      maxScore: 100,
      percentage: 88,
      grade: "B+",
      feedback: "Good understanding of concepts",
      submittedDate: "2024-12-10",
      gradedDate: "2024-12-11",
      createdDate: "2024-12-11",
      updatedDate: "2024-12-11"
    }
  ],
  homeworkAssignments: [
    {
      id: "1",
      classId: "1",
      title: "Quadratic Equations Practice",
      description: "Complete practice problems on solving quadratic equations",
      assignedDate: "2024-11-25",
      dueDate: "2024-11-29",
      totalPoints: 20,
      instructions: "Complete problems 1-20 on page 145",
      resources: ["Textbook Chapter 4"],
      createdDate: "2024-11-25",
      updatedDate: "2024-11-25"
    }
  ],
  homeworkSubmissions: [
    {
      id: "1",
      assignmentId: "1",
      studentId: "1",
      submittedDate: "2024-11-29",
      score: 18,
      maxScore: 20,
      grade: "A-",
      feedback: "Excellent work!",
      status: "graded" as const,
      gradedDate: "2024-11-30",
      createdDate: "2024-11-29",
      updatedDate: "2024-11-30"
    }
  ]
}

  }
} catch (error) {
    console.warn('Could not load frontend mock data, using fallback data')
    // Fallback to simplified mock data
    return {
      students: [
        {
          id: "1",
          name: "Alice Johnson",
          email: "alice.johnson@email.com",
          phone: "(555) 123-4567",
          grade: "10th Grade",
          parentContact: "(555) 123-4568",
          enrollmentDate: "2024-08-15"
        },
        {
          id: "2",
          name: "Bob Smith",
          email: "bob.smith@email.com",
          phone: "(555) 234-5678",
          grade: "11th Grade",
          parentContact: "(555) 234-5679",
          enrollmentDate: "2024-08-16"
        },
        {
          id: "3",
          name: "Carol Davis",
          email: "carol.davis@email.com",
          phone: "(555) 345-6789",
          grade: "10th Grade",
          parentContact: "(555) 345-6790",
          enrollmentDate: "2024-08-17"
        }
      ],
      classes: [
        {
          id: "1",
          name: "Algebra II",
          subject: "Mathematics",
          description: "Advanced algebra concepts including polynomials, logarithms, and trigonometry",
          room: "Math 101",
          capacity: 25,
          enrolledStudents: ["1", "3"],
          createdDate: "2024-08-01",
          color: "#3b82f6"
        },
        {
          id: "2",
          name: "Chemistry Fundamentals",
          subject: "Science",
          description: "Introduction to chemical principles, reactions, and laboratory techniques",
          room: "Science 205",
          capacity: 20,
          enrolledStudents: ["2"],
          createdDate: "2024-08-02",
          color: "#10b981"
        }
      ],
      schedules: [
        { id: "1", classId: "1", dayOfWeek: 1, startTime: "09:00", endTime: "10:30" },
        { id: "2", classId: "1", dayOfWeek: 3, startTime: "09:00", endTime: "10:30" },
        { id: "3", classId: "2", dayOfWeek: 2, startTime: "11:00", endTime: "12:30" }
      ],
      scheduleExceptions: [],
      meetings: [
        {
          id: "1",
          title: "Parent-Teacher Conference - Alice Johnson",
          description: "Discuss Alice's progress in mathematics",
          date: "2024-12-10",
          startTime: "14:00",
          endTime: "14:30",
          participants: ["1"],
          participantType: "parents" as const,
          location: "Classroom Math 101",
          meetingType: "in-person" as const,
          status: "scheduled" as const,
          createdDate: "2024-12-01",
          notes: "Focus on algebra concepts"
        }
      ],
      attendanceRecords: [
        {
          id: "1",
          classId: "1",
          date: "2024-12-02",
          attendanceData: [
            { studentId: "1", status: "present" as const },
            { studentId: "3", status: "late" as const, notes: "Arrived 10 minutes late" }
          ],
          createdDate: "2024-12-02"
        }
      ],
      classNotes: [
        {
          id: "1",
          classId: "1",
          date: "2024-12-02",
          content: "Covered quadratic equations and factoring methods",
          topics: ["Quadratic equations", "Factoring"],
          homework: "Complete problems 1-20 on page 145",
          objectives: "Students will be able to factor quadratic expressions",
          createdDate: "2024-12-02",
          updatedDate: "2024-12-02"
        }
      ],
      tests: [
        {
          id: "1",
          classId: "1",
          title: "Quadratic Equations Test",
          description: "Comprehensive test covering quadratic equations",
          testDate: "2024-12-10",
          totalPoints: 100,
          testType: "exam" as const,
          fileName: "algebra_test.pdf",
          createdDate: "2024-12-01",
          updatedDate: "2024-12-01"
        }
      ],
      testResults: [
        {
          id: "1",
          testId: "1",
          studentId: "1",
          score: 88,
          maxScore: 100,
          percentage: 88,
          grade: "B+",
          feedback: "Good understanding of concepts",
          submittedDate: "2024-12-10",
          gradedDate: "2024-12-11",
          createdDate: "2024-12-11",
          updatedDate: "2024-12-11"
        }
      ],
      homeworkAssignments: [
        {
          id: "1",
          classId: "1",
          title: "Quadratic Equations Practice",
          description: "Complete practice problems on solving quadratic equations",
          assignedDate: "2024-11-25",
          dueDate: "2024-11-29",
          totalPoints: 20,
          instructions: "Complete problems 1-20 on page 145",
          resources: ["Textbook Chapter 4"],
          createdDate: "2024-11-25",
          updatedDate: "2024-11-25"
        }
      ],
      homeworkSubmissions: [
        {
          id: "1",
          assignmentId: "1",
          studentId: "1",
          submittedDate: "2024-11-29",
          score: 18,
          maxScore: 20,
          grade: "A-",
          feedback: "Excellent work!",
          status: "graded" as const,
          gradedDate: "2024-11-30",
          createdDate: "2024-11-29",
          updatedDate: "2024-11-30"
        }
      ]
    }
  }
}

async function main() {
  console.log('🚀 Starting data migration from mock data to database...')
  
  try {
    const migrationService = new DataMigrationService()
    
    // Load mock data
    const mockData = await loadMockDataFromFrontend()
    console.log('📊 Loaded mock data with:')
    console.log(`  - ${mockData.students.length} students`)
    console.log(`  - ${mockData.classes.length} classes`)
    console.log(`  - ${mockData.schedules.length} schedules`)
    console.log(`  - ${mockData.tests.length} tests`)
    console.log(`  - ${mockData.homeworkAssignments.length} homework assignments`)
    
    // Run the migration
    const result = await migrationService.migrateAllData(mockData)
    
    if (result.success) {
      console.log('🎉 Data migration completed successfully!')
      console.log('📊 Migration summary:', result.summary)
    } else {
      console.error('❌ Data migration failed!')
      console.error('Errors:', result.errors)
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Data migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Test the migration service with various scenarios
 */
async function runTests() {
  console.log('🧪 Running migration tests...')
  
  try {
    const migrationService = new DataMigrationService()
    const testResult = await migrationService.testMigration()
    
    if (testResult.success) {
      console.log('✅ All migration tests passed!')
    } else {
      console.error('❌ Some migration tests failed!')
      console.log('Test results:', testResult.results)
    }
  } catch (error) {
    console.error('❌ Migration tests failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  main()
}

export { main as migrateData }