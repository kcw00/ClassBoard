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
  meetingType: "in-person" | "virtual"
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

export const mockData = {
  homeworkAssignments: [
    {
      id: "1",
      classId: "1", // Algebra II
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
      classId: "1", // Algebra II
      title: "Factoring Worksheet",
      description: "Practice factoring various types of quadratic expressions",
      assignedDate: "2024-12-02",
      dueDate: "2024-12-06",
      totalPoints: 15,
      instructions: "Complete the factoring worksheet. Use different methods where appropriate.",
      resources: ["Factoring reference sheet"],
      createdDate: "2024-12-02",
      updatedDate: "2024-12-02"
    },
    {
      id: "3",
      classId: "2", // Chemistry Fundamentals
      title: "Chemical Bonding Worksheet",
      description: "Practice identifying and drawing chemical bonds",
      assignedDate: "2024-11-28",
      dueDate: "2024-12-02",
      totalPoints: 25,
      instructions: "Complete all problems on the bonding worksheet. Draw Lewis structures where requested.",
      resources: ["Periodic table", "Lewis structure examples"],
      createdDate: "2024-11-28",
      updatedDate: "2024-11-28"
    },
    {
      id: "4",
      classId: "2", // Chemistry Fundamentals
      title: "Lab Report - Ionic Compounds",
      description: "Write a lab report on the ionic compounds experiment",
      assignedDate: "2024-12-03",
      dueDate: "2024-12-10",
      totalPoints: 50,
      instructions: "Include hypothesis, procedure, observations, and conclusions. Follow the lab report template.",
      resources: ["Lab report template", "Lab data sheets"],
      createdDate: "2024-12-03",
      updatedDate: "2024-12-03"
    },
    {
      id: "5",
      classId: "3", // World History
      title: "WWI Timeline Assignment",
      description: "Create a detailed timeline of World War I events",
      assignedDate: "2024-11-20",
      dueDate: "2024-11-27",
      totalPoints: 30,
      instructions: "Include at least 15 major events with dates and brief descriptions.",
      resources: ["History textbook", "Online timeline tools"],
      createdDate: "2024-11-20",
      updatedDate: "2024-11-20"
    },
    {
      id: "6",
      classId: "4", // English Literature
      title: "Hamlet Reading Questions",
      description: "Answer comprehension questions for Act 1 of Hamlet",
      assignedDate: "2024-11-30",
      dueDate: "2024-12-04",
      totalPoints: 20,
      instructions: "Answer all questions in complete sentences. Support answers with text evidence.",
      resources: ["Hamlet text", "Reading guide"],
      createdDate: "2024-11-30",
      updatedDate: "2024-11-30"
    },
    {
      id: "7",
      classId: "5", // Physics Concepts
      title: "Force and Motion Problems",
      description: "Practice problems on Newton's laws and motion",
      assignedDate: "2024-12-01",
      dueDate: "2024-12-05",
      totalPoints: 35,
      instructions: "Solve all problems showing work step by step. Include proper units.",
      resources: ["Physics formula sheet", "Online physics simulations"],
      createdDate: "2024-12-01",
      updatedDate: "2024-12-01"
    }
  ] as HomeworkAssignment[],

  homeworkSubmissions: [
    // Alice Johnson (Student ID: 1) submissions
    {
      id: "1",
      assignmentId: "1", // Quadratic Equations Practice
      studentId: "1",
      submittedDate: "2024-11-29",
      score: 18,
      maxScore: 20,
      grade: "A-",
      feedback: "Excellent work! Minor calculation error on problem 15.",
      status: "graded",
      gradedDate: "2024-11-30",
      createdDate: "2024-11-29",
      updatedDate: "2024-11-30"
    },
    {
      id: "2",
      assignmentId: "2", // Factoring Worksheet
      studentId: "1",
      submittedDate: "2024-12-06",
      score: 14,
      maxScore: 15,
      grade: "A-",
      feedback: "Good understanding of factoring methods. Watch sign errors.",
      status: "graded",
      gradedDate: "2024-12-07",
      createdDate: "2024-12-06",
      updatedDate: "2024-12-07"
    },
    {
      id: "3",
      assignmentId: "5", // WWI Timeline Assignment
      studentId: "1",
      submittedDate: "2024-11-27",
      score: 28,
      maxScore: 30,
      grade: "A-",
      feedback: "Comprehensive timeline with good detail. Missing one minor event.",
      status: "graded",
      gradedDate: "2024-11-28",
      createdDate: "2024-11-27",
      updatedDate: "2024-11-28"
    },
    // Bob Smith (Student ID: 2) submissions
    {
      id: "4",
      assignmentId: "3", // Chemical Bonding Worksheet
      studentId: "2",
      submittedDate: "2024-12-02",
      score: 22,
      maxScore: 25,
      grade: "B+",
      feedback: "Good work on ionic bonds. Review covalent bonding concepts.",
      status: "graded",
      gradedDate: "2024-12-03",
      createdDate: "2024-12-02",
      updatedDate: "2024-12-03"
    },
    {
      id: "5",
      assignmentId: "4", // Lab Report - Ionic Compounds
      studentId: "2",
      maxScore: 50,
      status: "not_submitted",
      createdDate: "2024-12-03",
      updatedDate: "2024-12-03"
    },
    {
      id: "6",
      assignmentId: "5", // WWI Timeline Assignment
      studentId: "2",
      submittedDate: "2024-11-28",
      score: 24,
      maxScore: 30,
      grade: "B",
      feedback: "Good timeline but needs more detail on some events.",
      status: "graded",
      gradedDate: "2024-11-29",
      createdDate: "2024-11-28",
      updatedDate: "2024-11-29"
    },
    // Carol Davis (Student ID: 3) submissions
    {
      id: "7",
      assignmentId: "1", // Quadratic Equations Practice
      studentId: "3",
      submittedDate: "2024-11-30",
      score: 15,
      maxScore: 20,
      grade: "C+",
      feedback: "Understanding is developing. Practice more complex problems.",
      status: "graded",
      gradedDate: "2024-12-01",
      createdDate: "2024-11-30",
      updatedDate: "2024-12-01"
    },
    {
      id: "8",
      assignmentId: "2", // Factoring Worksheet
      studentId: "3",
      maxScore: 15,
      status: "not_submitted",
      createdDate: "2024-12-02",
      updatedDate: "2024-12-02"
    },
    {
      id: "9",
      assignmentId: "6", // Hamlet Reading Questions
      studentId: "3",
      submittedDate: "2024-12-04",
      score: 17,
      maxScore: 20,
      grade: "B",
      feedback: "Good comprehension. Include more text evidence in answers.",
      status: "graded",
      gradedDate: "2024-12-05",
      createdDate: "2024-12-04",
      updatedDate: "2024-12-05"
    },
    // David Wilson (Student ID: 4) submissions
    {
      id: "10",
      assignmentId: "3", // Chemical Bonding Worksheet
      studentId: "4",
      submittedDate: "2024-12-01",
      score: 25,
      maxScore: 25,
      grade: "A",
      feedback: "Perfect! Excellent understanding of bonding concepts.",
      status: "graded",
      gradedDate: "2024-12-02",
      createdDate: "2024-12-01",
      updatedDate: "2024-12-02"
    },
    {
      id: "11",
      assignmentId: "5", // WWI Timeline Assignment
      studentId: "4",
      submittedDate: "2024-11-26",
      score: 30,
      maxScore: 30,
      grade: "A",
      feedback: "Outstanding timeline! Very detailed and well-organized.",
      status: "graded",
      gradedDate: "2024-11-27",
      createdDate: "2024-11-26",
      updatedDate: "2024-11-27"
    },
    {
      id: "12",
      assignmentId: "7", // Force and Motion Problems
      studentId: "4",
      submittedDate: "2024-12-05",
      score: 33,
      maxScore: 35,
      grade: "A-",
      feedback: "Excellent problem-solving skills. Minor unit error on problem 8.",
      status: "graded",
      gradedDate: "2024-12-06",
      createdDate: "2024-12-05",
      updatedDate: "2024-12-06"
    },
    // Emily Brown (Student ID: 5) submissions
    {
      id: "13",
      assignmentId: "3", // Chemical Bonding Worksheet
      studentId: "5",
      submittedDate: "2024-12-03",
      score: 18,
      maxScore: 25,
      grade: "C",
      feedback: "Basic understanding present. Schedule help session for bonding concepts.",
      status: "graded",
      gradedDate: "2024-12-04",
      createdDate: "2024-12-03",
      updatedDate: "2024-12-04"
    },
    {
      id: "14",
      assignmentId: "6", // Hamlet Reading Questions
      studentId: "5",
      submittedDate: "2024-12-05",
      score: 16,
      maxScore: 20,
      grade: "B-",
      feedback: "Good effort. Work on analyzing character motivations more deeply.",
      status: "graded",
      gradedDate: "2024-12-06",
      createdDate: "2024-12-05",
      updatedDate: "2024-12-06"
    },
    // Frank Miller (Student ID: 6) submissions
    {
      id: "15",
      assignmentId: "1", // Quadratic Equations Practice
      studentId: "6",
      submittedDate: "2024-11-29",
      score: 19,
      maxScore: 20,
      grade: "A",
      feedback: "Excellent work! Very thorough and accurate.",
      status: "graded",
      gradedDate: "2024-11-30",
      createdDate: "2024-11-29",
      updatedDate: "2024-11-30"
    },
    {
      id: "16",
      assignmentId: "2", // Factoring Worksheet
      studentId: "6",
      submittedDate: "2024-12-07",
      maxScore: 15,
      status: "late",
      submissionNotes: "Submitted one day late due to illness",
      createdDate: "2024-12-07",
      updatedDate: "2024-12-07"
    },
    {
      id: "17",
      assignmentId: "6", // Hamlet Reading Questions
      studentId: "6",
      submittedDate: "2024-12-04",
      score: 19,
      maxScore: 20,
      grade: "A",
      feedback: "Insightful analysis with strong textual support.",
      status: "graded",
      gradedDate: "2024-12-05",
      createdDate: "2024-12-04",
      updatedDate: "2024-12-05"
    },
    {
      id: "18",
      assignmentId: "7", // Force and Motion Problems
      studentId: "6",
      submittedDate: "2024-12-04",
      score: 35,
      maxScore: 35,
      grade: "A",
      feedback: "Perfect! Excellent understanding of physics concepts.",
      status: "graded",
      gradedDate: "2024-12-05",
      createdDate: "2024-12-04",
      updatedDate: "2024-12-05"
    }
  ] as HomeworkSubmission[],

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
  ] as Student[],

  classes: [
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
    },
    {
      id: "4",
      name: "English Literature",
      subject: "Language Arts",
      description: "Analysis of classic and contemporary literature",
      room: "English 302",
      capacity: 25,
      enrolledStudents: ["3", "5", "6"],
      createdDate: "2024-08-04",
      color: "#8b5cf6"
    },
    {
      id: "5",
      name: "Physics Concepts",
      subject: "Science",
      description: "Fundamental physics principles including mechanics and energy",
      room: "Science 301",
      capacity: 22,
      enrolledStudents: ["1", "4", "6"],
      createdDate: "2024-08-05",
      color: "#ef4444"
    },
    {
      id: "6",
      name: "Math Tutoring",
      subject: "Mathematics",
      description: "Extra help session for students struggling with math concepts",
      room: "Math 101",
      capacity: 15,
      enrolledStudents: ["1", "3"],
      createdDate: "2024-08-06",
      color: "#ec4899"
    },
    {
      id: "7",
      name: "Literature Club",
      subject: "Language Arts",
      description: "Weekly discussion group for classic and contemporary literature",
      room: "English 302",
      capacity: 20,
      enrolledStudents: ["3", "5", "6"],
      createdDate: "2024-08-07",
      color: "#6366f1"
    }
  ] as Class[],

  schedules: [
    { id: "1", classId: "1", dayOfWeek: 1, startTime: "09:00", endTime: "10:30" },
    { id: "2", classId: "1", dayOfWeek: 3, startTime: "09:00", endTime: "10:30" },
    { id: "3", classId: "1", dayOfWeek: 5, startTime: "09:00", endTime: "10:30" },
    { id: "4", classId: "2", dayOfWeek: 2, startTime: "11:00", endTime: "12:30" },
    { id: "5", classId: "2", dayOfWeek: 4, startTime: "11:00", endTime: "12:30" },
    { id: "6", classId: "3", dayOfWeek: 1, startTime: "13:30", endTime: "15:00" },
    { id: "7", classId: "3", dayOfWeek: 3, startTime: "13:30", endTime: "15:00" },
    { id: "8", classId: "4", dayOfWeek: 2, startTime: "08:00", endTime: "09:30" },
    { id: "9", classId: "4", dayOfWeek: 5, startTime: "08:00", endTime: "09:30" },
    { id: "10", classId: "5", dayOfWeek: 1, startTime: "15:30", endTime: "17:00" },
    { id: "11", classId: "5", dayOfWeek: 4, startTime: "15:30", endTime: "17:00" },
    // Weekend schedules
    { id: "12", classId: "6", dayOfWeek: 6, startTime: "10:00", endTime: "11:30" }, // Saturday Math tutoring
    { id: "13", classId: "7", dayOfWeek: 0, startTime: "14:00", endTime: "15:30" } // Sunday Literature club
  ] as Schedule[],

  meetings: [
    {
      id: "1",
      title: "Parent-Teacher Conference - Alice Johnson",
      description: "Discuss Alice's progress in mathematics and upcoming assignments",
      date: "2024-12-10",
      startTime: "14:00",
      endTime: "14:30",
      participants: ["1"],
      participantType: "parents",
      location: "Classroom Math 101",
      meetingType: "in-person",
      status: "scheduled",
      createdDate: "2024-12-01",
      notes: "Focus on algebra concepts and study habits"
    },
    {
      id: "2",
      title: "Academic Support Session - Bob Smith",
      description: "One-on-one session to help with chemistry lab reports",
      date: "2024-12-08",
      startTime: "15:30",
      endTime: "16:00",
      participants: ["2"],
      participantType: "students",
      location: "Science Lab 205",
      meetingType: "in-person",
      status: "completed",
      createdDate: "2024-11-25",
      notes: "Reviewed safety protocols and report formatting"
    },
    {
      id: "3",
      title: "IEP Planning Meeting - Carol Davis",
      description: "Annual IEP review and planning session with parents and support staff",
      date: "2024-12-12",
      startTime: "10:00",
      endTime: "11:00",
      participants: ["3"],
      participantType: "parents",
      location: "Conference Room A",
      meetingType: "in-person",
      status: "scheduled",
      createdDate: "2024-11-20",
      notes: "Include special education coordinator and school counselor"
    },
    {
      id: "4",
      title: "College Prep Discussion - David Wilson",
      description: "Meeting to discuss college applications and recommendation letters",
      date: "2024-12-15",
      startTime: "13:00",
      endTime: "13:45",
      participants: ["4"],
      participantType: "students",
      location: "Virtual Meeting",
      meetingType: "virtual",
      status: "scheduled",
      createdDate: "2024-12-02",
      notes: "Review application deadlines and scholarship opportunities"
    },
    {
      id: "5",
      title: "Behavioral Intervention Team Meeting",
      description: "Team meeting to discuss intervention strategies for multiple students",
      date: "2024-12-09",
      startTime: "08:00",
      endTime: "09:00",
      participants: ["Emily Brown", "Frank Miller"],
      participantType: "teachers",
      location: "Principal's Office",
      meetingType: "in-person",
      status: "completed",
      createdDate: "2024-11-28",
      notes: "Developed positive behavior support plans"
    },
    {
      id: "6",
      title: "Weekend Academic Support Session",
      description: "Extra help session for struggling students in mathematics",
      date: "2024-12-14",
      startTime: "09:00",
      endTime: "10:30",
      participants: ["1", "3"],
      participantType: "students",
      location: "Math 101",
      meetingType: "in-person",
      status: "scheduled",
      createdDate: "2024-12-01",
      notes: "Focus on algebra and problem-solving techniques"
    },
    {
      id: "7",
      title: "Parent Coffee Hour",
      description: "Informal gathering for parents to discuss school programs and ask questions",
      date: "2024-12-15",
      startTime: "15:00",
      endTime: "16:00",
      participants: ["Parent Community"],
      participantType: "parents",
      location: "School Cafeteria",
      meetingType: "in-person",
      status: "scheduled",
      createdDate: "2024-11-15",
      notes: "Refreshments will be provided"
    },
    // Add some meetings for today for testing
    {
      id: "8",
      title: "Today's Parent Meeting",
      description: "Meeting with parents about student progress",
      date: new Date().toISOString().split('T')[0], // Today's date
      startTime: "10:00",
      endTime: "10:30",
      participants: ["Parent Test"],
      participantType: "parents",
      location: "Conference Room B",
      meetingType: "in-person",
      status: "scheduled",
      createdDate: new Date().toISOString().split('T')[0],
      notes: "Test meeting for today"
    },
    {
      id: "9",
      title: "Student Check-in",
      description: "Weekly check-in with student about academic progress",
      date: new Date().toISOString().split('T')[0], // Today's date  
      startTime: "14:00",
      endTime: "14:30",
      participants: ["1"],
      participantType: "students",
      location: "Guidance Office",
      meetingType: "in-person",
      status: "scheduled",
      createdDate: new Date().toISOString().split('T')[0],
      notes: "Regular academic progress check"
    }
  ] as Meeting[],

  attendanceRecords: [
    {
      id: "1",
      classId: "1", // Algebra II
      date: "2024-12-02", // Monday
      attendanceData: [
        { studentId: "1", status: "present" },
        { studentId: "3", status: "late", notes: "Arrived 10 minutes late" },
        { studentId: "6", status: "present" }
      ],
      createdDate: "2024-12-02",
      updatedDate: "2024-12-02"
    },
    {
      id: "2", 
      classId: "2", // Chemistry Fundamentals
      date: "2024-12-03", // Tuesday
      attendanceData: [
        { studentId: "2", status: "present" },
        { studentId: "4", status: "absent", notes: "Sick leave" },
        { studentId: "5", status: "present" }
      ],
      createdDate: "2024-12-03",
      updatedDate: "2024-12-03"
    },
    {
      id: "3",
      classId: "3", // World History  
      date: "2024-12-02", // Monday
      attendanceData: [
        { studentId: "1", status: "present" },
        { studentId: "2", status: "present" },
        { studentId: "4", status: "excused", notes: "Medical appointment" }
      ],
      createdDate: "2024-12-02",
      updatedDate: "2024-12-02"
    },
    {
      id: "4",
      classId: "1", // Algebra II
      date: new Date().toISOString().split('T')[0], // Today's date
      attendanceData: [
        { studentId: "1", status: "present" },
        { studentId: "3", status: "present" },
        { studentId: "6", status: "late", notes: "Traffic delay" }
      ],
      createdDate: new Date().toISOString().split('T')[0]
    },
    {
      id: "5",
      classId: "2", // Chemistry Fundamentals  
      date: new Date().toISOString().split('T')[0], // Today's date
      attendanceData: [
        { studentId: "2", status: "absent", notes: "Family emergency" },
        { studentId: "4", status: "present" },
        { studentId: "5", status: "present" }
      ],
      createdDate: new Date().toISOString().split('T')[0]
    }
  ] as AttendanceRecord[],

  classNotes: [
    {
      id: "1",
      classId: "1", // Algebra II
      date: "2024-12-02",
      content: "Covered quadratic equations and factoring methods. Students showed good understanding of basic concepts.",
      topics: ["Quadratic equations", "Factoring", "Graphing parabolas"],
      homework: "Complete problems 1-20 on page 145. Practice factoring worksheet.",
      objectives: "Students will be able to factor quadratic expressions and solve quadratic equations",
      createdDate: "2024-12-02",
      updatedDate: "2024-12-02"
    },
    {
      id: "2",
      classId: "2", // Chemistry Fundamentals
      date: "2024-12-03", 
      content: "Introduced chemical bonding concepts. Conducted lab demonstration of ionic vs covalent compounds.",
      topics: ["Chemical bonding", "Ionic compounds", "Covalent compounds", "Lab safety"],
      homework: "Read Chapter 8, sections 8.1-8.3. Complete bonding practice sheet.",
      objectives: "Students will distinguish between ionic and covalent bonding",
      createdDate: "2024-12-03",
      updatedDate: "2024-12-03"
    },
    {
      id: "3",
      classId: "3", // World History
      date: "2024-12-02",
      content: "Discussed the causes of World War I. Students engaged well in group discussions about nationalism.",
      topics: ["WWI causes", "Nationalism", "Alliance systems", "Imperialism"],
      homework: "Essay: Analyze the role of nationalism in starting WWI (2 pages, due Friday)",
      objectives: "Students will analyze the multiple causes of World War I",
      createdDate: "2024-12-02", 
      updatedDate: "2024-12-02"
    }
  ] as ClassNote[],

  tests: [
    {
      id: "1",
      classId: "1", // Algebra II
      title: "Quadratic Equations Test",
      description: "Comprehensive test covering quadratic equations, factoring, and graphing",
      testDate: "2024-12-10",
      totalPoints: 100,
      testType: "exam",
      fileName: "algebra_quadratic_test.pdf",
      createdDate: "2024-12-01",
      updatedDate: "2024-12-01"
    },
    {
      id: "2",
      classId: "2", // Chemistry Fundamentals
      title: "Chemical Bonding Quiz",
      description: "Quiz on ionic and covalent bonding concepts",
      testDate: "2024-12-05",
      totalPoints: 50,
      testType: "quiz",
      fileName: "chemistry_bonding_quiz.pdf",
      createdDate: "2024-11-28",
      updatedDate: "2024-11-28"
    },
    {
      id: "3",
      classId: "3", // World History
      title: "WWI Causes Essay",
      description: "2-page analytical essay on the causes of World War I",
      testDate: "2024-12-06",
      totalPoints: 75,
      testType: "assignment",
      createdDate: "2024-11-29",
      updatedDate: "2024-11-29"
    },
    {
      id: "4",
      classId: "4", // English Literature
      title: "Shakespeare Analysis Project",
      description: "Character analysis project on Hamlet",
      testDate: "2024-12-12",
      totalPoints: 150,
      testType: "project",
      createdDate: "2024-11-15",
      updatedDate: "2024-11-15"
    },
    {
      id: "5",
      classId: "5", // Physics Concepts
      title: "Mechanics Midterm",
      description: "Midterm exam covering mechanics, forces, and energy",
      testDate: "2024-12-08",
      totalPoints: 120,
      testType: "exam",
      fileName: "physics_mechanics_midterm.pdf",
      createdDate: "2024-11-20",
      updatedDate: "2024-11-20"
    }
  ] as Test[],

  testResults: [
    // Quadratic Equations Test Results
    {
      id: "1",
      testId: "1",
      studentId: "1", // Alice Johnson
      score: 88,
      maxScore: 100,
      percentage: 88,
      grade: "B+",
      feedback: "Good understanding of concepts. Need to work on complex factoring problems.",
      submittedDate: "2024-12-10",
      gradedDate: "2024-12-11",
      createdDate: "2024-12-11",
      updatedDate: "2024-12-11"
    },
    {
      id: "2",
      testId: "1",
      studentId: "3", // Carol Davis
      score: 76,
      maxScore: 100,
      percentage: 76,
      grade: "C+",
      feedback: "Solid basic understanding. Continue practicing graphing techniques.",
      submittedDate: "2024-12-10",
      gradedDate: "2024-12-11",
      createdDate: "2024-12-11",
      updatedDate: "2024-12-11"
    },
    {
      id: "3",
      testId: "1",
      studentId: "6", // Frank Miller
      score: 92,
      maxScore: 100,
      percentage: 92,
      grade: "A-",
      feedback: "Excellent work! Strong problem-solving skills demonstrated.",
      submittedDate: "2024-12-10",
      gradedDate: "2024-12-11",
      createdDate: "2024-12-11",
      updatedDate: "2024-12-11"
    },
    // Chemical Bonding Quiz Results
    {
      id: "4",
      testId: "2",
      studentId: "2", // Bob Smith
      score: 42,
      maxScore: 50,
      percentage: 84,
      grade: "B",
      feedback: "Good grasp of ionic bonding. Review covalent bond formation.",
      submittedDate: "2024-12-05",
      gradedDate: "2024-12-06",
      createdDate: "2024-12-06",
      updatedDate: "2024-12-06"
    },
    {
      id: "5",
      testId: "2",
      studentId: "4", // David Wilson
      score: 46,
      maxScore: 50,
      percentage: 92,
      grade: "A-",
      feedback: "Excellent understanding of bonding concepts. Well done!",
      submittedDate: "2024-12-05",
      gradedDate: "2024-12-06",
      createdDate: "2024-12-06",
      updatedDate: "2024-12-06"
    },
    {
      id: "6",
      testId: "2",
      studentId: "5", // Emily Brown
      score: 35,
      maxScore: 50,
      percentage: 70,
      grade: "C-",
      feedback: "Basic understanding present. Schedule tutoring for additional support.",
      submittedDate: "2024-12-05",
      gradedDate: "2024-12-06",
      createdDate: "2024-12-06",
      updatedDate: "2024-12-06"
    },
    // WWI Causes Essay Results
    {
      id: "7",
      testId: "3",
      studentId: "1", // Alice Johnson
      score: 68,
      maxScore: 75,
      percentage: 91,
      grade: "A-",
      feedback: "Thoughtful analysis with strong supporting evidence. Excellent critical thinking.",
      submittedDate: "2024-12-06",
      gradedDate: "2024-12-08",
      createdDate: "2024-12-08",
      updatedDate: "2024-12-08"
    },
    {
      id: "8",
      testId: "3",
      studentId: "2", // Bob Smith
      score: 59,
      maxScore: 75,
      percentage: 79,
      grade: "C+",
      feedback: "Good historical facts. Work on developing stronger thesis statements.",
      submittedDate: "2024-12-06",
      gradedDate: "2024-12-08",
      createdDate: "2024-12-08",
      updatedDate: "2024-12-08"
    },
    {
      id: "9",
      testId: "3",
      studentId: "4", // David Wilson
      score: 72,
      maxScore: 75,
      percentage: 96,
      grade: "A",
      feedback: "Outstanding analysis! Clear writing and well-supported arguments.",
      submittedDate: "2024-12-06",
      gradedDate: "2024-12-08",
      createdDate: "2024-12-08",
      updatedDate: "2024-12-08"
    }
  ] as TestResult[],

  scheduleExceptions: [
    // Example: Move Algebra II class from Monday 9:00 to Tuesday 10:00 for December 16th only
    {
      id: "1",
      scheduleId: "1", // Algebra II Monday 9:00-10:30
      date: "2024-12-16", 
      startTime: "10:00",
      endTime: "11:30",
      createdDate: new Date().toISOString().split('T')[0]
    },
    // Example: Cancel Chemistry class on Thursday Dec 19th
    {
      id: "2", 
      scheduleId: "5", // Chemistry Thursday 11:00-12:30
      date: "2024-12-19",
      startTime: "11:00",
      endTime: "12:30", 
      cancelled: true,
      createdDate: new Date().toISOString().split('T')[0]
    }
  ] as ScheduleException[]
}