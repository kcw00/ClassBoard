import { prisma } from '../config/database'
import type {
  Student,
  Class,
  Schedule,
  ScheduleException,
  Meeting,
  AttendanceRecord,
  ClassNote,
  Test,
  TestResult,
  HomeworkAssignment,
  HomeworkSubmission
} from '@prisma/client'

// Import types from the frontend mock data
interface MockStudent {
  id: string
  name: string
  email: string
  phone: string
  grade: string
  parentContact: string
  enrollmentDate: string
}

interface MockClass {
  id: string
  name: string
  subject: string
  description: string
  room: string
  capacity: number
  enrolledStudents: string[]
  createdDate: string
  color: string
}

interface MockSchedule {
  id: string
  classId: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface MockScheduleException {
  id: string
  scheduleId: string
  date: string
  startTime: string
  endTime: string
  cancelled?: boolean
  createdDate: string
}

interface MockMeeting {
  id: string
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  participants: string[]
  participantType: "students" | "parents" | "teachers"
  location: string
  meetingType: "in-person" | "virtual"
  status: "scheduled" | "completed" | "cancelled"
  createdDate: string
  notes?: string
}

interface MockAttendanceRecord {
  id: string
  classId: string
  date: string
  attendanceData: Array<{
    studentId: string
    status: 'present' | 'absent' | 'late' | 'excused'
    notes?: string
  }>
  createdDate: string
  updatedDate?: string
}

interface MockClassNote {
  id: string
  classId: string
  date: string
  content: string
  topics?: string[]
  homework?: string
  objectives?: string
  createdDate: string
  updatedDate: string
}

interface MockTest {
  id: string
  classId: string
  title: string
  description: string
  testDate: string
  totalPoints: number
  testType: 'quiz' | 'exam' | 'assignment' | 'project'
  fileName?: string
  fileUrl?: string
  createdDate: string
  updatedDate: string
}

interface MockTestResult {
  id: string
  testId: string
  studentId: string
  score: number
  maxScore: number
  percentage: number
  grade: string
  feedback?: string
  submittedDate?: string
  gradedDate: string
  createdDate: string
  updatedDate: string
}

interface MockHomeworkAssignment {
  id: string
  classId: string
  title: string
  description: string
  assignedDate: string
  dueDate: string
  totalPoints: number
  instructions?: string
  resources?: string[]
  createdDate: string
  updatedDate: string
}

interface MockHomeworkSubmission {
  id: string
  assignmentId: string
  studentId: string
  submittedDate?: string
  score?: number
  maxScore: number
  grade?: string
  feedback?: string
  status: 'not_submitted' | 'submitted' | 'graded' | 'late'
  submissionNotes?: string
  gradedDate?: string
  createdDate: string
  updatedDate: string
}

interface MockData {
  students: MockStudent[]
  classes: MockClass[]
  schedules: MockSchedule[]
  scheduleExceptions: MockScheduleException[]
  meetings: MockMeeting[]
  attendanceRecords: MockAttendanceRecord[]
  classNotes: MockClassNote[]
  tests: MockTest[]
  testResults: MockTestResult[]
  homeworkAssignments: MockHomeworkAssignment[]
  homeworkSubmissions: MockHomeworkSubmission[]
}

export class DataMigrationService {
  /**
   * Migrate all mock data to the database
   */
  async migrateAllData(mockData: MockData): Promise<void> {
    console.log('🚀 Starting complete data migration...')

    try {
      // Clear existing data (in reverse order of dependencies)
      await this.clearExistingData()

      // Create default user if not exists
      await this.createDefaultUser()

      // Migrate core entities first
      await this.migrateStudents(mockData.students)
      await this.migrateClasses(mockData.classes)
      
      // Migrate class enrollments
      await this.migrateClassEnrollments(mockData.classes)
      
      // Migrate schedules and related data
      await this.migrateSchedules(mockData.schedules)
      await this.migrateScheduleExceptions(mockData.scheduleExceptions)
      
      // Migrate educational content
      await this.migrateTests(mockData.tests)
      await this.migrateTestResults(mockData.testResults)
      await this.migrateHomeworkAssignments(mockData.homeworkAssignments)
      await this.migrateHomeworkSubmissions(mockData.homeworkSubmissions)
      
      // Migrate attendance and notes
      await this.migrateAttendanceRecords(mockData.attendanceRecords)
      await this.migrateClassNotes(mockData.classNotes)
      
      // Migrate meetings
      await this.migrateMeetings(mockData.meetings)

      console.log('✅ Data migration completed successfully!')
    } catch (error) {
      console.error('❌ Data migration failed:', error)
      throw error
    }
  }

  /**
   * Clear existing data from all tables
   */
  private async clearExistingData(): Promise<void> {
    console.log('🧹 Clearing existing data...')
    
    // Delete in reverse order of dependencies
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
  }

  /**
   * Create a default user for the system
   */
  private async createDefaultUser(): Promise<void> {
    await prisma.user.create({
      data: {
        id: "default-teacher-1",
        email: "teacher@classboard.com",
        name: "Default Teacher",
        role: "TEACHER"
      }
    })
    console.log('✅ Created default user')
  }

  /**
   * Migrate students data
   */
  private async migrateStudents(students: MockStudent[]): Promise<void> {
    for (const student of students) {
      await prisma.student.create({
        data: {
          id: student.id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          grade: student.grade,
          parentContact: student.parentContact,
          enrollmentDate: student.enrollmentDate
        }
      })
    }
    console.log(`✅ Migrated ${students.length} students`)
  }

  /**
   * Migrate classes data
   */
  private async migrateClasses(classes: MockClass[]): Promise<void> {
    for (const classData of classes) {
      await prisma.class.create({
        data: {
          id: classData.id,
          name: classData.name,
          subject: classData.subject,
          description: classData.description,
          room: classData.room,
          capacity: classData.capacity,
          color: classData.color,
          createdDate: classData.createdDate
        }
      })
    }
    console.log(`✅ Migrated ${classes.length} classes`)
  }

  /**
   * Migrate class enrollments from the enrolledStudents arrays
   */
  private async migrateClassEnrollments(classes: MockClass[]): Promise<void> {
    let enrollmentCount = 0
    for (const classData of classes) {
      for (const studentId of classData.enrolledStudents) {
        await prisma.classEnrollment.create({
          data: {
            classId: classData.id,
            studentId: studentId
          }
        })
        enrollmentCount++
      }
    }
    console.log(`✅ Migrated ${enrollmentCount} class enrollments`)
  }

  /**
   * Migrate schedules data
   */
  private async migrateSchedules(schedules: MockSchedule[]): Promise<void> {
    for (const schedule of schedules) {
      await prisma.schedule.create({
        data: {
          id: schedule.id,
          classId: schedule.classId,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime
        }
      })
    }
    console.log(`✅ Migrated ${schedules.length} schedules`)
  }

  /**
   * Migrate schedule exceptions data
   */
  private async migrateScheduleExceptions(exceptions: MockScheduleException[]): Promise<void> {
    for (const exception of exceptions) {
      await prisma.scheduleException.create({
        data: {
          id: exception.id,
          scheduleId: exception.scheduleId,
          date: exception.date,
          startTime: exception.startTime,
          endTime: exception.endTime,
          cancelled: exception.cancelled || false,
          createdDate: exception.createdDate
        }
      })
    }
    console.log(`✅ Migrated ${exceptions.length} schedule exceptions`)
  }

  /**
   * Migrate meetings data
   */
  private async migrateMeetings(meetings: MockMeeting[]): Promise<void> {
    for (const meeting of meetings) {
      await prisma.meeting.create({
        data: {
          id: meeting.id,
          title: meeting.title,
          description: meeting.description,
          date: meeting.date,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          participants: meeting.participants,
          participantType: meeting.participantType,
          location: meeting.location,
          meetingType: meeting.meetingType === 'in-person' ? 'in_person' : 'virtual',
          status: meeting.status,
          createdDate: meeting.createdDate,
          notes: meeting.notes
        }
      })
    }
    console.log(`✅ Migrated ${meetings.length} meetings`)
  }

  /**
   * Migrate attendance records data
   */
  private async migrateAttendanceRecords(attendanceRecords: MockAttendanceRecord[]): Promise<void> {
    for (const record of attendanceRecords) {
      // Create the attendance record
      const attendanceRecord = await prisma.attendanceRecord.create({
        data: {
          id: record.id,
          classId: record.classId,
          date: record.date,
          createdDate: record.createdDate,
          updatedDate: record.updatedDate
        }
      })

      // Create attendance entries for each student
      for (const entry of record.attendanceData) {
        await prisma.attendanceEntry.create({
          data: {
            attendanceRecordId: attendanceRecord.id,
            studentId: entry.studentId,
            status: entry.status,
            notes: entry.notes
          }
        })
      }
    }
    console.log(`✅ Migrated ${attendanceRecords.length} attendance records`)
  }

  /**
   * Migrate class notes data
   */
  private async migrateClassNotes(classNotes: MockClassNote[]): Promise<void> {
    for (const note of classNotes) {
      await prisma.classNote.create({
        data: {
          id: note.id,
          classId: note.classId,
          date: note.date,
          content: note.content,
          topics: note.topics || [],
          homework: note.homework,
          objectives: note.objectives,
          createdDate: note.createdDate,
          updatedDate: note.updatedDate
        }
      })
    }
    console.log(`✅ Migrated ${classNotes.length} class notes`)
  }

  /**
   * Migrate tests data
   */
  private async migrateTests(tests: MockTest[]): Promise<void> {
    for (const test of tests) {
      await prisma.test.create({
        data: {
          id: test.id,
          classId: test.classId,
          title: test.title,
          description: test.description,
          testDate: test.testDate,
          totalPoints: test.totalPoints,
          testType: test.testType,
          fileName: test.fileName,
          fileUrl: test.fileUrl,
          createdDate: test.createdDate,
          updatedDate: test.updatedDate
        }
      })
    }
    console.log(`✅ Migrated ${tests.length} tests`)
  }

  /**
   * Migrate test results data
   */
  private async migrateTestResults(testResults: MockTestResult[]): Promise<void> {
    for (const result of testResults) {
      await prisma.testResult.create({
        data: {
          id: result.id,
          testId: result.testId,
          studentId: result.studentId,
          score: result.score,
          maxScore: result.maxScore,
          percentage: result.percentage,
          grade: result.grade,
          feedback: result.feedback,
          submittedDate: result.submittedDate,
          gradedDate: result.gradedDate,
          createdDate: result.createdDate,
          updatedDate: result.updatedDate
        }
      })
    }
    console.log(`✅ Migrated ${testResults.length} test results`)
  }

  /**
   * Migrate homework assignments data
   */
  private async migrateHomeworkAssignments(assignments: MockHomeworkAssignment[]): Promise<void> {
    for (const assignment of assignments) {
      await prisma.homeworkAssignment.create({
        data: {
          id: assignment.id,
          classId: assignment.classId,
          title: assignment.title,
          description: assignment.description,
          assignedDate: assignment.assignedDate,
          dueDate: assignment.dueDate,
          totalPoints: assignment.totalPoints,
          instructions: assignment.instructions,
          resources: assignment.resources || [],
          createdDate: assignment.createdDate,
          updatedDate: assignment.updatedDate
        }
      })
    }
    console.log(`✅ Migrated ${assignments.length} homework assignments`)
  }

  /**
   * Migrate homework submissions data
   */
  private async migrateHomeworkSubmissions(submissions: MockHomeworkSubmission[]): Promise<void> {
    for (const submission of submissions) {
      await prisma.homeworkSubmission.create({
        data: {
          id: submission.id,
          assignmentId: submission.assignmentId,
          studentId: submission.studentId,
          submittedDate: submission.submittedDate,
          score: submission.score,
          maxScore: submission.maxScore,
          grade: submission.grade,
          feedback: submission.feedback,
          status: submission.status,
          submissionNotes: submission.submissionNotes,
          gradedDate: submission.gradedDate,
          createdDate: submission.createdDate,
          updatedDate: submission.updatedDate
        }
      })
    }
    console.log(`✅ Migrated ${submissions.length} homework submissions`)
  }

  /**
   * Validate data integrity after migration
   */
  async validateMigration(): Promise<boolean> {
    try {
      console.log('🔍 Validating migration...')
      
      const counts = {
        users: await prisma.user.count(),
        students: await prisma.student.count(),
        classes: await prisma.class.count(),
        enrollments: await prisma.classEnrollment.count(),
        schedules: await prisma.schedule.count(),
        tests: await prisma.test.count(),
        homeworkAssignments: await prisma.homeworkAssignment.count()
      }

      console.log('📊 Migration summary:', counts)
      
      // Basic validation - ensure we have data
      if (counts.students === 0 || counts.classes === 0) {
        throw new Error('Migration validation failed: Missing core data')
      }

      console.log('✅ Migration validation passed')
      return true
    } catch (error) {
      console.error('❌ Migration validation failed:', error)
      return false
    }
  }
}