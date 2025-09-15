import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Import mock data interfaces and data
interface Student {
  id: string
  name: string
  email: string
  phone: string
  grade: string
  parentContact: string
  enrollmentDate: string
}

interface Class {
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

interface Schedule {
  id: string
  classId: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface ScheduleException {
  id: string
  scheduleId: string
  date: string
  startTime: string
  endTime: string
  cancelled?: boolean
  createdDate: string
}

interface Meeting {
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

interface AttendanceRecord {
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

interface ClassNote {
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

interface Test {
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

interface TestResult {
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

interface HomeworkAssignment {
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

interface HomeworkSubmission {
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

// Mock data (simplified version for seeding)
const mockStudents: Student[] = [
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
  },
  {
    id: "4",
    name: "David Wilson",
    email: "david.wilson@email.com",
    phone: "(555) 456-7890",
    grade: "12th Grade",
    parentContact: "(555) 456-7891",
    enrollmentDate: "2024-08-18"
  },
  {
    id: "5",
    name: "Emily Brown",
    email: "emily.brown@email.com",
    phone: "(555) 567-8901",
    grade: "11th Grade",
    parentContact: "(555) 567-8902",
    enrollmentDate: "2024-08-19"
  },
  {
    id: "6",
    name: "Frank Miller",
    email: "frank.miller@email.com",
    phone: "(555) 678-9012",
    grade: "10th Grade",
    parentContact: "(555) 678-9013",
    enrollmentDate: "2024-08-20"
  }
]

const mockClasses: Class[] = [
  {
    id: "1",
    name: "Algebra II",
    subject: "Mathematics",
    description: "Advanced algebra concepts including polynomials, logarithms, and trigonometry",
    room: "Math 101",
    capacity: 25,
    enrolledStudents: ["1", "3", "6"],
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
    enrolledStudents: ["2", "4", "5"],
    createdDate: "2024-08-02",
    color: "#10b981"
  },
  {
    id: "3",
    name: "World History",
    subject: "Social Studies",
    description: "Comprehensive study of world civilizations and historical events",
    room: "History 150",
    capacity: 30,
    enrolledStudents: ["1", "2", "4"],
    createdDate: "2024-08-03",
    color: "#f59e0b"
  }
]

const mockSchedules: Schedule[] = [
  { id: "1", classId: "1", dayOfWeek: 1, startTime: "09:00", endTime: "10:30" },
  { id: "2", classId: "1", dayOfWeek: 3, startTime: "09:00", endTime: "10:30" },
  { id: "3", classId: "1", dayOfWeek: 5, startTime: "09:00", endTime: "10:30" },
  { id: "4", classId: "2", dayOfWeek: 2, startTime: "11:00", endTime: "12:30" },
  { id: "5", classId: "2", dayOfWeek: 4, startTime: "11:00", endTime: "12:30" },
  { id: "6", classId: "3", dayOfWeek: 1, startTime: "13:30", endTime: "15:00" },
  { id: "7", classId: "3", dayOfWeek: 3, startTime: "13:30", endTime: "15:00" }
]

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create a default user
  const defaultUser = await prisma.user.create({
    data: {
      id: "default-teacher-1",
      email: "teacher@classboard.com",
      name: "Default Teacher",
      role: "TEACHER"
    }
  })
  console.log('✅ Created default user')

  // Seed students
  for (const student of mockStudents) {
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
  console.log('✅ Seeded students')

  // Seed classes
  for (const classData of mockClasses) {
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
  console.log('✅ Seeded classes')

  // Seed class enrollments
  for (const classData of mockClasses) {
    for (const studentId of classData.enrolledStudents) {
      await prisma.classEnrollment.create({
        data: {
          classId: classData.id,
          studentId: studentId
        }
      })
    }
  }
  console.log('✅ Seeded class enrollments')

  // Seed schedules
  for (const schedule of mockSchedules) {
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
  console.log('✅ Seeded schedules')

  // Seed some sample tests
  const sampleTests = [
    {
      id: "1",
      classId: "1",
      title: "Quadratic Equations Test",
      description: "Comprehensive test covering quadratic equations, factoring, and graphing",
      testDate: "2024-12-10",
      totalPoints: 100,
      testType: "exam" as const,
      fileName: "algebra_quadratic_test.pdf",
      createdDate: "2024-12-01",
      updatedDate: "2024-12-01"
    },
    {
      id: "2",
      classId: "2",
      title: "Chemical Bonding Quiz",
      description: "Quiz on ionic and covalent bonding concepts",
      testDate: "2024-12-05",
      totalPoints: 50,
      testType: "quiz" as const,
      fileName: "chemistry_bonding_quiz.pdf",
      createdDate: "2024-11-28",
      updatedDate: "2024-11-28"
    }
  ]

  for (const test of sampleTests) {
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
        createdDate: test.createdDate,
        updatedDate: test.updatedDate
      }
    })
  }
  console.log('✅ Seeded tests')

  // Seed some sample homework assignments
  const sampleHomework = [
    {
      id: "1",
      classId: "1",
      title: "Quadratic Equations Practice",
      description: "Complete practice problems on solving quadratic equations using various methods",
      assignedDate: "2024-11-25",
      dueDate: "2024-11-29",
      totalPoints: 20,
      instructions: "Complete problems 1-20 on page 145. Show all work and check your answers.",
      resources: ["Textbook Chapter 4", "Online graphing calculator"],
      createdDate: "2024-11-25",
      updatedDate: "2024-11-25"
    },
    {
      id: "2",
      classId: "2",
      title: "Chemical Bonding Worksheet",
      description: "Practice identifying and drawing chemical bonds",
      assignedDate: "2024-11-28",
      dueDate: "2024-12-02",
      totalPoints: 25,
      instructions: "Complete all problems on the bonding worksheet. Draw Lewis structures where requested.",
      resources: ["Periodic table", "Lewis structure examples"],
      createdDate: "2024-11-28",
      updatedDate: "2024-11-28"
    }
  ]

  for (const homework of sampleHomework) {
    await prisma.homeworkAssignment.create({
      data: {
        id: homework.id,
        classId: homework.classId,
        title: homework.title,
        description: homework.description,
        assignedDate: homework.assignedDate,
        dueDate: homework.dueDate,
        totalPoints: homework.totalPoints,
        instructions: homework.instructions,
        resources: homework.resources,
        createdDate: homework.createdDate,
        updatedDate: homework.updatedDate
      }
    })
  }
  console.log('✅ Seeded homework assignments')

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })