// TypeScript type definitions for the ClassBoard application

export interface Student {
  id: string
  name: string
  email: string
  phone: string
  grade: string
  parentContact: string
  enrollmentDate: string
}

export interface Class {
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

export interface Schedule {
  id: string
  classId: string
  dayOfWeek: number // 0 = Sunday, 1 = Monday, etc.
  startTime: string
  endTime: string
}

export interface ScheduleException {
  id: string
  scheduleId: string
  date: string // YYYY-MM-DD format - specific date for the exception
  startTime: string
  endTime: string
  cancelled?: boolean // true if the class is cancelled for this date
  createdDate: string
}

export interface Meeting {
  id: string
  title: string
  description: string
  date: string // YYYY-MM-DD format
  startTime: string
  endTime: string
  participants: string[] // Student IDs or names
  participantType: "students" | "parents" | "teachers"
  location: string
  meetingType: "in_person" | "virtual"
  status: "scheduled" | "completed" | "cancelled"
  createdDate: string
  notes?: string
}

export interface AttendanceRecord {
  id: string
  classId: string
  date: string // YYYY-MM-DD format
  attendanceData: Array<{
    studentId: string
    status: 'present' | 'absent' | 'late' | 'excused'
    notes?: string
  }>
  createdDate: string
  updatedDate?: string
}

export interface ClassNote {
  id: string
  classId: string
  date: string // YYYY-MM-DD format
  content: string
  topics?: string[]
  homework?: string
  objectives?: string
  createdDate: string
  updatedDate: string
}

export interface Test {
  id: string
  classId: string
  title: string
  description: string
  testDate: string // YYYY-MM-DD format
  testTime: string // HH:MM format
  totalPoints: number
  testType: 'quiz' | 'exam' | 'assignment' | 'project'
  fileName?: string
  fileUrl?: string
  files?: { name: string; url?: string }[]
  createdDate: string
  updatedDate: string
}

export interface TestResult {
  attachedFile: unknown
  id: string
  testId: string
  studentId: string
  score: number
  maxScore: number
  percentage: number
  grade: string // A, B, C, D, F
  feedback?: string
  submittedDate?: string
  gradedDate: string
  submittedFiles?: { name: string; url?: string; type: 'submission' | 'graded' }[]
  createdDate: string
  updatedDate: string
}

export interface HomeworkAssignment {
  id: string
  classId: string
  title: string
  description: string
  assignedDate: string // YYYY-MM-DD format
  dueDate: string // YYYY-MM-DD format
  totalPoints: number
  instructions?: string
  resources?: string[]
  createdDate: string
  updatedDate: string
}

export interface HomeworkSubmission {
  id: string
  assignmentId: string
  studentId: string
  submittedDate?: string // YYYY-MM-DD format, undefined if not submitted
  score?: number
  maxScore: number
  grade?: string // A, B, C, D, F
  feedback?: string
  status: 'not_submitted' | 'submitted' | 'graded' | 'late'
  submissionNotes?: string
  gradedDate?: string
  createdDate: string
  updatedDate: string
}

export const classColors = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Red", value: "#ef4444" },
  { name: "Pink", value: "#ec4899" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Orange", value: "#f97316" },
  { name: "Emerald", value: "#059669" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Violet", value: "#7c3aed" }
]