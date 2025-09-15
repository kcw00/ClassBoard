import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react'
import type { Class, Student, Schedule, ScheduleException, Meeting, AttendanceRecord, ClassNote, Test, TestResult, HomeworkAssignment, HomeworkSubmission } from '@/types'

interface AppData {
  classes: Class[]
  students: Student[]
  schedules: Schedule[]
  scheduleExceptions: ScheduleException[]
  meetings: Meeting[]
  attendanceRecords: AttendanceRecord[]
  classNotes: ClassNote[]
  tests: Test[]
  testResults: TestResult[]
  homeworkAssignments: HomeworkAssignment[]
  homeworkSubmissions: HomeworkSubmission[]
}

interface AppActions {
  refreshData(): void
  addClass: (classData: Omit<Class, 'id' | 'createdDate' | 'enrolledStudents'>) => Class
  addStudent: (studentData: Omit<Student, 'id' | 'enrollmentDate'>) => Student
  updateStudent: (studentId: string, updates: Partial<Student>) => void
  deleteStudent: (studentId: string) => void
  addSchedule: (scheduleData: Omit<Schedule, 'id'>) => Schedule
  updateSchedule: (scheduleId: string, updates: Partial<Schedule>) => void
  updateClass: (classId: string, updates: Partial<Class>) => void
  enrollStudent: (classId: string, studentId: string) => void
  unenrollStudent: (classId: string, studentId: string) => void
  deleteSchedule: (scheduleId: string) => void
  addScheduleException: (exceptionData: Omit<ScheduleException, 'id' | 'createdDate'>) => ScheduleException
  updateScheduleException: (exceptionId: string, updates: Partial<ScheduleException>) => void
  deleteScheduleException: (exceptionId: string) => void
  addMeeting: (meetingData: Omit<Meeting, 'id' | 'createdDate'>) => Meeting
  updateMeeting: (meetingId: string, updates: Partial<Meeting>) => void
  deleteMeeting: (meetingId: string) => void
  addAttendanceRecord: (attendanceData: Omit<AttendanceRecord, 'id' | 'createdDate'>) => AttendanceRecord
  updateAttendanceRecord: (attendanceId: string, updates: Partial<AttendanceRecord>) => void
  addClassNote: (noteData: Omit<ClassNote, 'id' | 'createdDate' | 'updatedDate'>) => ClassNote
  updateClassNote: (noteId: string, updates: Partial<ClassNote>) => void
  deleteClassNote: (noteId: string) => void
  addTest: (testData: Omit<Test, 'id' | 'createdDate' | 'updatedDate'>) => Test
  updateTest: (testId: string, updates: Partial<Test>) => void
  deleteTest: (testId: string) => void
  addTestResult: (resultData: Omit<TestResult, 'id' | 'createdDate' | 'updatedDate'>) => TestResult
  updateTestResult: (resultId: string, updates: Partial<TestResult>) => void
  deleteTestResult: (resultId: string) => void
  addHomeworkAssignment: (assignmentData: Omit<HomeworkAssignment, 'id' | 'createdDate' | 'updatedDate'>) => HomeworkAssignment
  updateHomeworkAssignment: (assignmentId: string, updates: Partial<HomeworkAssignment>) => void
  deleteHomeworkAssignment: (assignmentId: string) => void
  addHomeworkSubmission: (submissionData: Omit<HomeworkSubmission, 'id' | 'createdDate' | 'updatedDate'>) => HomeworkSubmission
  updateHomeworkSubmission: (submissionId: string, updates: Partial<HomeworkSubmission>) => void
  deleteHomeworkSubmission: (submissionId: string) => void
}

interface AppDataContextType {
  data: AppData
  actions: AppActions
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined)

export function useAppData() {
  const context = useContext(AppDataContext)
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider')
  }
  return context
}

interface AppDataProviderProps {
  children: ReactNode
}

export function AppDataProvider({ children }: AppDataProviderProps) {
  const [classes, setClasses] = useState<Class[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [scheduleExceptions, setScheduleExceptions] = useState<ScheduleException[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [classNotes, setClassNotes] = useState<ClassNote[]>([])
  const [tests, setTests] = useState<Test[]>([])
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [homeworkAssignments, setHomeworkAssignments] = useState<HomeworkAssignment[]>([])
  const [homeworkSubmissions, setHomeworkSubmissions] = useState<HomeworkSubmission[]>([])

  // Note: This legacy context is now deprecated in favor of AppDataService
  // It's kept for backward compatibility but should not be used in production

  const addClass = (classData: Omit<Class, 'id' | 'createdDate' | 'enrolledStudents'>) => {
    const newClass: Class = {
      id: (classes.length + 1).toString(),
      ...classData,
      capacity: parseInt(classData.capacity.toString()),
      enrolledStudents: [],
      createdDate: new Date().toISOString().split('T')[0]
    }
    setClasses([...classes, newClass])
    return newClass
  }

  const addStudent = (studentData: Omit<Student, 'id' | 'enrollmentDate'>) => {
    const newStudent: Student = {
      id: (students.length + 1).toString(),
      ...studentData,
      enrollmentDate: new Date().toISOString().split('T')[0]
    }
    setStudents([...students, newStudent])
    return newStudent
  }

  const updateStudent = (studentId: string, updates: Partial<Student>) => {
    const updatedStudents = students.map(student =>
      student.id === studentId ? { ...student, ...updates } : student
    )
    setStudents(updatedStudents)
  }

  const deleteStudent = (studentId: string) => {
    const updatedStudents = students.filter(student => student.id !== studentId)
    setStudents(updatedStudents)

    const updatedClasses = classes.map(classItem => ({
      ...classItem,
      enrolledStudents: classItem.enrolledStudents.filter(id => id !== studentId)
    }))
    setClasses(updatedClasses)

    const updatedAttendanceRecords = attendanceRecords.map(record => ({
      ...record,
      attendanceData: record.attendanceData.filter(entry => entry.studentId !== studentId)
    }))
    setAttendanceRecords(updatedAttendanceRecords)
  }

  const addSchedule = (scheduleData: Omit<Schedule, 'id'>) => {
    const newSchedule: Schedule = {
      id: (schedules.length + 1).toString(),
      ...scheduleData,
      dayOfWeek: parseInt(scheduleData.dayOfWeek.toString())
    }
    setSchedules([...schedules, newSchedule])
    return newSchedule
  }

  const updateClass = (classId: string, updates: Partial<Class>) => {
    const updatedClasses = classes.map(classItem =>
      classItem.id === classId ? { ...classItem, ...updates } : classItem
    )
    setClasses(updatedClasses)
  }

  const enrollStudent = (classId: string, studentId: string) => {
    const updatedClasses = classes.map(classItem => {
      if (classItem.id === classId) {
        const enrolledStudents = classItem.enrolledStudents.includes(studentId)
          ? classItem.enrolledStudents
          : [...classItem.enrolledStudents, studentId]
        return { ...classItem, enrolledStudents }
      }
      return classItem
    })
    setClasses(updatedClasses)
  }

  const unenrollStudent = (classId: string, studentId: string) => {
    const updatedClasses = classes.map(classItem => {
      if (classItem.id === classId) {
        const enrolledStudents = classItem.enrolledStudents.filter(id => id !== studentId)
        return { ...classItem, enrolledStudents }
      }
      return classItem
    })
    setClasses(updatedClasses)
  }

  const updateSchedule = (scheduleId: string, updates: Partial<Schedule>) => {
    const updatedSchedules = schedules.map(schedule =>
      schedule.id === scheduleId ? { ...schedule, ...updates } : schedule
    )
    setSchedules(updatedSchedules)
  }

  const deleteSchedule = (scheduleId: string) => {
    const updatedSchedules = schedules.filter(schedule => schedule.id !== scheduleId)
    setSchedules(updatedSchedules)
  }

  const addScheduleException = (exceptionData: Omit<ScheduleException, 'id' | 'createdDate'>) => {
    const newException: ScheduleException = {
      id: (scheduleExceptions.length + 1).toString(),
      ...exceptionData,
      createdDate: new Date().toISOString().split('T')[0]
    }
    setScheduleExceptions([...scheduleExceptions, newException])
    return newException
  }

  const updateScheduleException = (exceptionId: string, updates: Partial<ScheduleException>) => {
    const updatedExceptions = scheduleExceptions.map(exception =>
      exception.id === exceptionId ? { ...exception, ...updates } : exception
    )
    setScheduleExceptions(updatedExceptions)
  }

  const deleteScheduleException = (exceptionId: string) => {
    const updatedExceptions = scheduleExceptions.filter(exception => exception.id !== exceptionId)
    setScheduleExceptions(updatedExceptions)
  }

  const addMeeting = (meetingData: Omit<Meeting, 'id' | 'createdDate'>) => {
    const newMeeting: Meeting = {
      id: (meetings.length + 1).toString(),
      ...meetingData,
      createdDate: new Date().toISOString().split('T')[0]
    }
    setMeetings([...meetings, newMeeting])
    return newMeeting
  }

  const updateMeeting = (meetingId: string, updates: Partial<Meeting>) => {
    const updatedMeetings = meetings.map(meeting =>
      meeting.id === meetingId ? { ...meeting, ...updates } : meeting
    )
    setMeetings(updatedMeetings)
  }

  const deleteMeeting = (meetingId: string) => {
    const updatedMeetings = meetings.filter(meeting => meeting.id !== meetingId)
    setMeetings(updatedMeetings)
  }

  const addAttendanceRecord = (attendanceData: Omit<AttendanceRecord, 'id' | 'createdDate'>) => {
    const newRecord: AttendanceRecord = {
      id: (attendanceRecords.length + 1).toString(),
      ...attendanceData,
      createdDate: new Date().toISOString().split('T')[0]
    }
    setAttendanceRecords([...attendanceRecords, newRecord])
    return newRecord
  }

  const updateAttendanceRecord = (attendanceId: string, updates: Partial<AttendanceRecord>) => {
    const updatedRecords = attendanceRecords.map(record =>
      record.id === attendanceId ? { ...record, ...updates } : record
    )
    setAttendanceRecords(updatedRecords)
  }

  const addClassNote = (noteData: Omit<ClassNote, 'id' | 'createdDate' | 'updatedDate'>) => {
    const newNote: ClassNote = {
      id: (classNotes.length + 1).toString(),
      ...noteData,
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0]
    }
    setClassNotes([...classNotes, newNote])
    return newNote
  }

  const updateClassNote = (noteId: string, updates: Partial<ClassNote>) => {
    const updatedNotes = classNotes.map(note =>
      note.id === noteId ? { ...note, ...updates, updatedDate: new Date().toISOString().split('T')[0] } : note
    )
    setClassNotes(updatedNotes)
  }

  const deleteClassNote = (noteId: string) => {
    const updatedNotes = classNotes.filter(note => note.id !== noteId)
    setClassNotes(updatedNotes)
  }

  const addTest = (testData: Omit<Test, 'id' | 'createdDate' | 'updatedDate'>) => {
    const newTest: Test = {
      id: (tests.length + 1).toString(),
      ...testData,
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0]
    }
    setTests([...tests, newTest])
    return newTest
  }

  const updateTest = (testId: string, updates: Partial<Test>) => {
    const updatedTests = tests.map(test =>
      test.id === testId ? { ...test, ...updates, updatedDate: new Date().toISOString().split('T')[0] } : test
    )
    setTests(updatedTests)
  }

  const deleteTest = (testId: string) => {
    const updatedTests = tests.filter(test => test.id !== testId)
    setTests(updatedTests)

    const updatedTestResults = testResults.filter(result => result.testId !== testId)
    setTestResults(updatedTestResults)
  }

  const addTestResult = (resultData: Omit<TestResult, 'id' | 'createdDate' | 'updatedDate'>) => {
    const newResult: TestResult = {
      id: (testResults.length + 1).toString(),
      ...resultData,
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0]
    }
    setTestResults([...testResults, newResult])
    return newResult
  }

  const updateTestResult = (resultId: string, updates: Partial<TestResult>) => {
    const updatedResults = testResults.map(result =>
      result.id === resultId ? { ...result, ...updates, updatedDate: new Date().toISOString().split('T')[0] } : result
    )
    setTestResults(updatedResults)
  }

  const deleteTestResult = (resultId: string) => {
    const updatedResults = testResults.filter(result => result.id !== resultId)
    setTestResults(updatedResults)
  }

  const addHomeworkAssignment = (assignmentData: Omit<HomeworkAssignment, 'id' | 'createdDate' | 'updatedDate'>) => {
    const newAssignment: HomeworkAssignment = {
      id: (homeworkAssignments.length + 1).toString(),
      ...assignmentData,
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0]
    }
    setHomeworkAssignments([...homeworkAssignments, newAssignment])
    return newAssignment
  }

  const updateHomeworkAssignment = (assignmentId: string, updates: Partial<HomeworkAssignment>) => {
    const updatedAssignments = homeworkAssignments.map(assignment =>
      assignment.id === assignmentId ? { ...assignment, ...updates, updatedDate: new Date().toISOString().split('T')[0] } : assignment
    )
    setHomeworkAssignments(updatedAssignments)
  }

  const deleteHomeworkAssignment = (assignmentId: string) => {
    const updatedAssignments = homeworkAssignments.filter(assignment => assignment.id !== assignmentId)
    setHomeworkAssignments(updatedAssignments)

    const updatedSubmissions = homeworkSubmissions.filter(submission => submission.assignmentId !== assignmentId)
    setHomeworkSubmissions(updatedSubmissions)
  }

  const addHomeworkSubmission = (submissionData: Omit<HomeworkSubmission, 'id' | 'createdDate' | 'updatedDate'>) => {
    const newSubmission: HomeworkSubmission = {
      id: (homeworkSubmissions.length + 1).toString(),
      ...submissionData,
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0]
    }
    setHomeworkSubmissions([...homeworkSubmissions, newSubmission])
    return newSubmission
  }

  const updateHomeworkSubmission = (submissionId: string, updates: Partial<HomeworkSubmission>) => {
    const updatedSubmissions = homeworkSubmissions.map(submission =>
      submission.id === submissionId ? { ...submission, ...updates, updatedDate: new Date().toISOString().split('T')[0] } : submission
    )
    setHomeworkSubmissions(updatedSubmissions)
  }

  const deleteHomeworkSubmission = (submissionId: string) => {
    const updatedSubmissions = homeworkSubmissions.filter(submission => submission.id !== submissionId)
    setHomeworkSubmissions(updatedSubmissions)
  }

  const appData = useMemo(() => ({
    classes,
    students,
    schedules,
    scheduleExceptions,
    meetings,
    attendanceRecords,
    classNotes,
    tests,
    testResults,
    homeworkAssignments,
    homeworkSubmissions
  }), [classes, students, schedules, scheduleExceptions, meetings, attendanceRecords, classNotes, tests, testResults, homeworkAssignments, homeworkSubmissions])

  const refreshData = () => {
    // Legacy refresh function - no longer loads mock data
    // Data should be fetched through AppDataService instead
    console.warn('AppDataContext.refreshData() is deprecated. Use AppDataService instead.')
  }

  const appActions = useMemo(() => ({
    refreshData,
    addClass,
    addStudent,
    updateStudent,
    deleteStudent,
    addSchedule,
    updateSchedule,
    updateClass,
    enrollStudent,
    unenrollStudent,
    deleteSchedule,
    addScheduleException,
    updateScheduleException,
    deleteScheduleException,
    addMeeting,
    updateMeeting,
    deleteMeeting,
    addAttendanceRecord,
    updateAttendanceRecord,
    addClassNote,
    updateClassNote,
    deleteClassNote,
    addTest,
    updateTest,
    deleteTest,
    addTestResult,
    updateTestResult,
    deleteTestResult,
    addHomeworkAssignment,
    updateHomeworkAssignment,
    deleteHomeworkAssignment,
    addHomeworkSubmission,
    updateHomeworkSubmission,
    deleteHomeworkSubmission
  }), [classes.length, students.length, schedules.length, scheduleExceptions.length, meetings.length, attendanceRecords.length, classNotes.length, tests.length, testResults.length, homeworkAssignments.length, homeworkSubmissions.length])

  const value = {
    data: appData,
    actions: appActions
  }

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  )
}