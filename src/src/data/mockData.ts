// Types
export interface Class {
  id: string
  name: string
  subject: string
  capacity: number
  schedule: string
  room: string
  instructor: string
  description: string
  enrolledStudents: string[]
  createdDate: string
}

export interface Student {
  id: string
  name: string
  email: string
  phone: string
  dateOfBirth: string
  address: string
  enrollmentDate: string
  emergencyContact: string
  notes: string
}

export interface Schedule {
  id: string
  classId: string
  dayOfWeek: number // 0 = Sunday, 1 = Monday, etc.
  startTime: string
  endTime: string
  location: string
}

export interface Meeting {
  id: string
  title: string
  description: string
  date: string
  time: string
  duration: number
  attendees: string[]
  location: string
  type: 'in-person' | 'virtual'
  createdDate: string
}

export interface AttendanceRecord {
  id: string
  classId: string
  date: string
  attendanceData: Array<{
    studentId: string
    status: 'present' | 'absent' | 'late' | 'excused'
    notes?: string
  }>
  createdDate: string
}

export interface ClassNote {
  id: string
  classId: string
  date: string
  title: string
  content: string
  topics: string[]
  homework: string
  nextClass: string
  createdDate: string
  updatedDate: string
}

export interface Test {
  id: string
  classId: string
  title: string
  description: string
  testDate: string
  totalPoints: number
  testType: string
  fileName?: string
  createdDate: string
  updatedDate: string
}

export interface TestResult {
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

export interface HomeworkAssignment {
  id: string
  classId: string
  title: string
  description: string
  dueDate: string
  totalPoints: number
  createdDate: string
  updatedDate: string
}

export interface HomeworkSubmission {
  id: string
  assignmentId: string
  studentId: string
  submittedDate: string
  score?: number
  feedback?: string
  status: 'submitted' | 'graded' | 'late' | 'missing'
  createdDate: string
  updatedDate: string
}

// Mock Data
export const mockData = {
  classes: [
    {
      id: "1",
      name: "Advanced Mathematics",
      subject: "Mathematics",
      capacity: 30,
      schedule: "Mon, Wed, Fri 10:00-11:00",
      room: "Room 201",
      instructor: "Dr. Smith",
      description: "Advanced calculus and linear algebra",
      enrolledStudents: ["1", "2", "3"],
      createdDate: "2024-08-15"
    },
    {
      id: "2", 
      name: "Physics Laboratory",
      subject: "Physics",
      capacity: 25,
      schedule: "Tue, Thu 14:00-16:00",
      room: "Lab 301",
      instructor: "Prof. Johnson",
      description: "Hands-on physics experiments",
      enrolledStudents: ["2", "4", "5"],
      createdDate: "2024-08-16"
    }
  ] as Class[],

  students: [
    {
      id: "1",
      name: "John Doe",
      email: "john.doe@email.com",
      phone: "(555) 123-4567",
      dateOfBirth: "2000-03-15",
      address: "123 Main St, City",
      enrollmentDate: "2024-08-20",
      emergencyContact: "Jane Doe (555) 987-6543",
      notes: "Excellent student, very punctual"
    },
    {
      id: "2",
      name: "Sarah Johnson",
      email: "sarah.j@email.com", 
      phone: "(555) 234-5678",
      dateOfBirth: "1999-11-22",
      address: "456 Oak Ave, City",
      enrollmentDate: "2024-08-21",
      emergencyContact: "Mike Johnson (555) 876-5432",
      notes: "Needs extra help with math"
    }
  ] as Student[],

  schedules: [
    {
      id: "1",
      classId: "1",
      dayOfWeek: 1, // Monday
      startTime: "10:00",
      endTime: "11:00",
      location: "Room 201"
    },
    {
      id: "2",
      classId: "1", 
      dayOfWeek: 3, // Wednesday
      startTime: "10:00",
      endTime: "11:00",
      location: "Room 201"
    }
  ] as Schedule[],

  meetings: [
    {
      id: "1",
      title: "Parent-Teacher Conference",
      description: "Discussing student progress",
      date: "2024-09-15",
      time: "14:00",
      duration: 30,
      attendees: ["1", "2"],
      location: "Room 101",
      type: "in-person" as const,
      createdDate: "2024-09-01"
    }
  ] as Meeting[],

  attendanceRecords: [
    {
      id: "1",
      classId: "1",
      date: "2024-09-02",
      attendanceData: [
        { studentId: "1", status: "present" as const },
        { studentId: "2", status: "absent" as const, notes: "Sick" }
      ],
      createdDate: "2024-09-02"
    }
  ] as AttendanceRecord[],

  classNotes: [
    {
      id: "1",
      classId: "1",
      date: "2024-09-02",
      title: "Introduction to Calculus",
      content: "Covered basic derivative concepts and rules",
      topics: ["Derivatives", "Chain Rule", "Product Rule"],
      homework: "Complete exercises 1-15 on page 45",
      nextClass: "Integration by parts",
      createdDate: "2024-09-02",
      updatedDate: "2024-09-02"
    }
  ] as ClassNote[],

  tests: [
    {
      id: "1",
      classId: "1",
      title: "Midterm Exam",
      description: "Covers chapters 1-5",
      testDate: "2024-09-20",
      totalPoints: 100,
      testType: "Written Exam",
      createdDate: "2024-09-01",
      updatedDate: "2024-09-01"
    }
  ] as Test[],

  testResults: [
    {
      id: "1",
      testId: "1",
      studentId: "1",
      score: 85,
      maxScore: 100,
      percentage: 85,
      grade: "B+",
      feedback: "Good work overall, minor errors in problem 3",
      gradedDate: "2024-09-22",
      createdDate: "2024-09-22",
      updatedDate: "2024-09-22"
    }
  ] as TestResult[],

  homeworkAssignments: [
    {
      id: "1",
      classId: "1",
      title: "Calculus Problem Set 1",
      description: "Complete problems 1-20",
      dueDate: "2024-09-10",
      totalPoints: 50,
      createdDate: "2024-09-03",
      updatedDate: "2024-09-03"
    }
  ] as HomeworkAssignment[],

  homeworkSubmissions: [
    {
      id: "1",
      assignmentId: "1",
      studentId: "1",
      submittedDate: "2024-09-09",
      score: 45,
      feedback: "Well done!",
      status: "graded" as const,
      createdDate: "2024-09-09",
      updatedDate: "2024-09-10"
    }
  ] as HomeworkSubmission[]
}