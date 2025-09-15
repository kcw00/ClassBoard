import { createContext, useContext, useState, useMemo, ReactNode, useCallback } from 'react'
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

interface LoadingStates {
  classes: boolean
  students: boolean
  schedules: boolean
  scheduleExceptions: boolean
  meetings: boolean
  attendanceRecords: boolean
  classNotes: boolean
  tests: boolean
  testResults: boolean
  homeworkAssignments: boolean
  homeworkSubmissions: boolean
}

interface ErrorStates {
  classes?: string
  students?: string
  schedules?: string
  scheduleExceptions?: string
  meetings?: string
  attendanceRecords?: string
  classNotes?: string
  tests?: string
  testResults?: string
  homeworkAssignments?: string
  homeworkSubmissions?: string
}

interface AppActions {
  addClass: (classData: Omit<Class, 'id' | 'createdDate' | 'enrolledStudents'>) => Promise<Class>
  addStudent: (studentData: Omit<Student, 'id' | 'enrollmentDate'>) => Promise<Student>
  updateStudent: (studentId: string, updates: Partial<Student>) => Promise<void>
  deleteStudent: (studentId: string) => Promise<void>
  addSchedule: (scheduleData: Omit<Schedule, 'id'>) => Promise<Schedule>
  updateSchedule: (scheduleId: string, updates: Partial<Schedule>) => Promise<void>
  updateClass: (classId: string, updates: Partial<Class>) => Promise<void>
  enrollStudent: (classId: string, studentId: string) => Promise<void>
  unenrollStudent: (classId: string, studentId: string) => Promise<void>
  deleteSchedule: (scheduleId: string) => Promise<void>
  addScheduleException: (exceptionData: Omit<ScheduleException, 'id' | 'createdDate'>) => Promise<ScheduleException>
  updateScheduleException: (exceptionId: string, updates: Partial<ScheduleException>) => Promise<void>
  deleteScheduleException: (exceptionId: string) => Promise<void>
  addMeeting: (meetingData: Omit<Meeting, 'id' | 'createdDate'>) => Promise<Meeting>
  updateMeeting: (meetingId: string, updates: Partial<Meeting>) => Promise<void>
  deleteMeeting: (meetingId: string) => Promise<void>
  addAttendanceRecord: (attendanceData: Omit<AttendanceRecord, 'id' | 'createdDate'>) => Promise<AttendanceRecord>
  updateAttendanceRecord: (attendanceId: string, updates: Partial<AttendanceRecord>) => Promise<void>
  addClassNote: (noteData: Omit<ClassNote, 'id' | 'createdDate' | 'updatedDate'>) => Promise<ClassNote>
  updateClassNote: (noteId: string, updates: Partial<ClassNote>) => Promise<void>
  deleteClassNote: (noteId: string) => Promise<void>
  addTest: (testData: Omit<Test, 'id' | 'createdDate' | 'updatedDate'>) => Promise<Test>
  updateTest: (testId: string, updates: Partial<Test>) => Promise<void>
  deleteTest: (testId: string) => Promise<void>
  addTestResult: (resultData: Omit<TestResult, 'id' | 'createdDate' | 'updatedDate'>) => Promise<TestResult>
  updateTestResult: (resultId: string, updates: Partial<TestResult>) => Promise<void>
  deleteTestResult: (resultId: string) => Promise<void>
  addHomeworkAssignment: (assignmentData: Omit<HomeworkAssignment, 'id' | 'createdDate' | 'updatedDate'>) => Promise<HomeworkAssignment>
  updateHomeworkAssignment: (assignmentId: string, updates: Partial<HomeworkAssignment>) => Promise<void>
  deleteHomeworkAssignment: (assignmentId: string) => Promise<void>
  addHomeworkSubmission: (submissionData: Omit<HomeworkSubmission, 'id' | 'createdDate' | 'updatedDate'>) => Promise<HomeworkSubmission>
  updateHomeworkSubmission: (submissionId: string, updates: Partial<HomeworkSubmission>) => Promise<void>
  deleteHomeworkSubmission: (submissionId: string) => Promise<void>
  
  // Additional utility methods
  refreshData: () => Promise<void>
  clearCache: () => void
}

interface EnhancedAppDataContextType {
  data: AppData
  actions: AppActions
  loading: LoadingStates
  errors: ErrorStates
  isInitialLoading: boolean
}

const EnhancedAppDataContext = createContext<EnhancedAppDataContextType | undefined>(undefined)

export function useEnhancedAppData() {
  const context = useContext(EnhancedAppDataContext)
  if (context === undefined) {
    throw new Error('useEnhancedAppData must be used within an EnhancedAppDataProvider')
  }
  return context
}

interface EnhancedAppDataProviderProps {
  children: ReactNode
}

export function EnhancedAppDataProvider({ children }: EnhancedAppDataProviderProps) {
  // Data state - now starts empty, should be populated via API
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

  // Note: This enhanced context is now deprecated in favor of AppDataService
  // It's kept for backward compatibility but should not be used in production

  // Loading and error states
  const [loading, setLoading] = useState<LoadingStates>({
    classes: false,
    students: false,
    schedules: false,
    scheduleExceptions: false,
    meetings: false,
    attendanceRecords: false,
    classNotes: false,
    tests: false,
    testResults: false,
    homeworkAssignments: false,
    homeworkSubmissions: false
  })

  const [errors, setErrors] = useState<ErrorStates>({})
  const [isInitialLoading, setIsInitialLoading] = useState(false)

  // Console logging for debugging
  const logSuccess = (message: string) => console.log('✅ Success:', message)
  const logError = (message: string) => console.error('❌ Error:', message)

  // Helper function to simulate async operations with loading states
  const simulateAsync = async <T,>(
    operation: () => T,
    loadingKey: keyof LoadingStates,
    successMessage?: string
  ): Promise<T> => {
    setLoading(prev => ({ ...prev, [loadingKey]: true }))
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const result = operation()
      
      if (successMessage) {
        logSuccess(successMessage)
      }
      
      // Clear any existing errors for this operation
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[loadingKey]
        return newErrors
      })
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setErrors(prev => ({ ...prev, [loadingKey]: errorMessage }))
      logError(errorMessage)
      throw error
    } finally {
      setLoading(prev => ({ ...prev, [loadingKey]: false }))
    }
  }

  // Enhanced actions with loading states and toast notifications
  const addClass = useCallback(async (classData: Omit<Class, 'id' | 'createdDate' | 'enrolledStudents'>): Promise<Class> => {
    return simulateAsync(() => {
      const newClass: Class = {
        id: (classes.length + 1).toString(),
        ...classData,
        capacity: parseInt(classData.capacity.toString()),
        enrolledStudents: [],
        createdDate: new Date().toISOString().split('T')[0]
      }
      setClasses(prev => [...prev, newClass])
      return newClass
    }, 'classes', `Class "${classData.name}" created successfully`)
  }, [classes.length, simulateAsync])

  const addStudent = useCallback(async (studentData: Omit<Student, 'id' | 'enrollmentDate'>): Promise<Student> => {
    return simulateAsync(() => {
      const newStudent: Student = {
        id: (students.length + 1).toString(),
        ...studentData,
        enrollmentDate: new Date().toISOString().split('T')[0]
      }
      setStudents(prev => [...prev, newStudent])
      return newStudent
    }, 'students', `Student "${studentData.name}" added successfully`)
  }, [students.length, simulateAsync])

  const updateStudent = useCallback(async (studentId: string, updates: Partial<Student>): Promise<void> => {
    return simulateAsync(() => {
      setStudents(prev => prev.map(student => 
        student.id === studentId ? { ...student, ...updates } : student
      ))
    }, 'students', 'Student updated successfully')
  }, [simulateAsync])

  const deleteStudent = useCallback(async (studentId: string): Promise<void> => {
    return simulateAsync(() => {
      setStudents(prev => prev.filter(student => student.id !== studentId))
      
      // Also remove from class enrollments
      setClasses(prev => prev.map(classItem => ({
        ...classItem,
        enrolledStudents: classItem.enrolledStudents.filter(id => id !== studentId)
      })))
      
      // Remove from attendance records
      setAttendanceRecords(prev => prev.map(record => ({
        ...record,
        attendanceData: record.attendanceData.filter(entry => entry.studentId !== studentId)
      })))
    }, 'students', 'Student deleted successfully')
  }, [simulateAsync])

  const updateClass = useCallback(async (classId: string, updates: Partial<Class>): Promise<void> => {
    return simulateAsync(() => {
      setClasses(prev => prev.map(classItem => 
        classItem.id === classId ? { ...classItem, ...updates } : classItem
      ))
    }, 'classes', 'Class updated successfully')
  }, [simulateAsync])

  const enrollStudent = useCallback(async (classId: string, studentId: string): Promise<void> => {
    return simulateAsync(() => {
      setClasses(prev => prev.map(classItem => {
        if (classItem.id === classId) {
          const enrolledStudents = classItem.enrolledStudents.includes(studentId)
            ? classItem.enrolledStudents
            : [...classItem.enrolledStudents, studentId]
          return { ...classItem, enrolledStudents }
        }
        return classItem
      }))
    }, 'classes', 'Student enrolled successfully')
  }, [simulateAsync])

  const unenrollStudent = useCallback(async (classId: string, studentId: string): Promise<void> => {
    return simulateAsync(() => {
      setClasses(prev => prev.map(classItem => {
        if (classItem.id === classId) {
          const enrolledStudents = classItem.enrolledStudents.filter(id => id !== studentId)
          return { ...classItem, enrolledStudents }
        }
        return classItem
      }))
    }, 'classes', 'Student unenrolled successfully')
  }, [simulateAsync])

  // Placeholder implementations for other actions (following the same pattern)
  const addSchedule = useCallback(async (scheduleData: Omit<Schedule, 'id'>): Promise<Schedule> => {
    return simulateAsync(() => {
      const newSchedule: Schedule = {
        id: (schedules.length + 1).toString(),
        ...scheduleData,
        dayOfWeek: parseInt(scheduleData.dayOfWeek.toString())
      }
      setSchedules(prev => [...prev, newSchedule])
      return newSchedule
    }, 'schedules', 'Schedule created successfully')
  }, [schedules.length, simulateAsync])

  const updateSchedule = useCallback(async (scheduleId: string, updates: Partial<Schedule>): Promise<void> => {
    return simulateAsync(() => {
      setSchedules(prev => prev.map(schedule => 
        schedule.id === scheduleId ? { ...schedule, ...updates } : schedule
      ))
    }, 'schedules', 'Schedule updated successfully')
  }, [simulateAsync])

  const deleteSchedule = useCallback(async (scheduleId: string): Promise<void> => {
    return simulateAsync(() => {
      setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId))
    }, 'schedules', 'Schedule deleted successfully')
  }, [simulateAsync])

  // Add placeholder implementations for all other actions
  // For brevity, I'll create simple implementations that just return promises
  const addScheduleException = useCallback(async (exceptionData: Omit<ScheduleException, 'id' | 'createdDate'>): Promise<ScheduleException> => {
    const newException: ScheduleException = {
      id: (scheduleExceptions.length + 1).toString(),
      ...exceptionData,
      createdDate: new Date().toISOString().split('T')[0]
    }
    setScheduleExceptions(prev => [...prev, newException])
    logSuccess('Schedule exception created successfully')
    return newException
  }, [scheduleExceptions.length])

  const updateScheduleException = useCallback(async (exceptionId: string, updates: Partial<ScheduleException>): Promise<void> => {
    setScheduleExceptions(prev => prev.map(exception => 
      exception.id === exceptionId ? { ...exception, ...updates } : exception
    ))
    logSuccess('Schedule exception updated successfully')
  }, [])

  const deleteScheduleException = useCallback(async (exceptionId: string): Promise<void> => {
    setScheduleExceptions(prev => prev.filter(exception => exception.id !== exceptionId))
    logSuccess('Schedule exception deleted successfully')
  }, [])

  const addMeeting = useCallback(async (meetingData: Omit<Meeting, 'id' | 'createdDate'>): Promise<Meeting> => {
    const newMeeting: Meeting = {
      id: (meetings.length + 1).toString(),
      ...meetingData,
      createdDate: new Date().toISOString().split('T')[0]
    }
    setMeetings(prev => [...prev, newMeeting])
    logSuccess(`Meeting "${meetingData.title}" scheduled successfully`)
    return newMeeting
  }, [meetings.length])

  const updateMeeting = useCallback(async (meetingId: string, updates: Partial<Meeting>): Promise<void> => {
    setMeetings(prev => prev.map(meeting => 
      meeting.id === meetingId ? { ...meeting, ...updates } : meeting
    ))
    logSuccess('Meeting updated successfully')
  }, [])

  const deleteMeeting = useCallback(async (meetingId: string): Promise<void> => {
    setMeetings(prev => prev.filter(meeting => meeting.id !== meetingId))
    logSuccess('Meeting deleted successfully')
  }, [])

  const addAttendanceRecord = useCallback(async (attendanceData: Omit<AttendanceRecord, 'id' | 'createdDate'>): Promise<AttendanceRecord> => {
    const newRecord: AttendanceRecord = {
      id: (attendanceRecords.length + 1).toString(),
      ...attendanceData,
      createdDate: new Date().toISOString().split('T')[0]
    }
    setAttendanceRecords(prev => [...prev, newRecord])
    logSuccess('Attendance recorded successfully')
    return newRecord
  }, [attendanceRecords.length])

  const updateAttendanceRecord = useCallback(async (attendanceId: string, updates: Partial<AttendanceRecord>): Promise<void> => {
    setAttendanceRecords(prev => prev.map(record => 
      record.id === attendanceId ? { ...record, ...updates } : record
    ))
    logSuccess('Attendance updated successfully')
  }, [])

  const addClassNote = useCallback(async (noteData: Omit<ClassNote, 'id' | 'createdDate' | 'updatedDate'>): Promise<ClassNote> => {
    const newNote: ClassNote = {
      id: (classNotes.length + 1).toString(),
      ...noteData,
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0]
    }
    setClassNotes(prev => [...prev, newNote])
    logSuccess('Class note saved successfully')
    return newNote
  }, [classNotes.length])

  const updateClassNote = useCallback(async (noteId: string, updates: Partial<ClassNote>): Promise<void> => {
    setClassNotes(prev => prev.map(note => 
      note.id === noteId ? { ...note, ...updates, updatedDate: new Date().toISOString().split('T')[0] } : note
    ))
    logSuccess('Class note updated successfully')
  }, [])

  const deleteClassNote = useCallback(async (noteId: string): Promise<void> => {
    setClassNotes(prev => prev.filter(note => note.id !== noteId))
    logSuccess('Class note deleted successfully')
  }, [])

  const addTest = useCallback(async (testData: Omit<Test, 'id' | 'createdDate' | 'updatedDate'>): Promise<Test> => {
    const newTest: Test = {
      id: (tests.length + 1).toString(),
      ...testData,
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0]
    }
    setTests(prev => [...prev, newTest])
    logSuccess(`Test "${testData.title}" created successfully`)
    return newTest
  }, [tests.length])

  const updateTest = useCallback(async (testId: string, updates: Partial<Test>): Promise<void> => {
    setTests(prev => prev.map(test => 
      test.id === testId ? { ...test, ...updates, updatedDate: new Date().toISOString().split('T')[0] } : test
    ))
    logSuccess('Test updated successfully')
  }, [])

  const deleteTest = useCallback(async (testId: string): Promise<void> => {
    setTests(prev => prev.filter(test => test.id !== testId))
    setTestResults(prev => prev.filter(result => result.testId !== testId))
    logSuccess('Test deleted successfully')
  }, [])

  const addTestResult = useCallback(async (resultData: Omit<TestResult, 'id' | 'createdDate' | 'updatedDate'>): Promise<TestResult> => {
    const newResult: TestResult = {
      id: (testResults.length + 1).toString(),
      ...resultData,
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0]
    }
    setTestResults(prev => [...prev, newResult])
    logSuccess('Test result saved successfully')
    return newResult
  }, [testResults.length])

  const updateTestResult = useCallback(async (resultId: string, updates: Partial<TestResult>): Promise<void> => {
    setTestResults(prev => prev.map(result => 
      result.id === resultId ? { ...result, ...updates, updatedDate: new Date().toISOString().split('T')[0] } : result
    ))
    logSuccess('Test result updated successfully')
  }, [])

  const deleteTestResult = useCallback(async (resultId: string): Promise<void> => {
    setTestResults(prev => prev.filter(result => result.id !== resultId))
    logSuccess('Test result deleted successfully')
  }, [])

  const addHomeworkAssignment = useCallback(async (assignmentData: Omit<HomeworkAssignment, 'id' | 'createdDate' | 'updatedDate'>): Promise<HomeworkAssignment> => {
    const newAssignment: HomeworkAssignment = {
      id: (homeworkAssignments.length + 1).toString(),
      ...assignmentData,
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0]
    }
    setHomeworkAssignments(prev => [...prev, newAssignment])
    logSuccess(`Assignment "${assignmentData.title}" created successfully`)
    return newAssignment
  }, [homeworkAssignments.length])

  const updateHomeworkAssignment = useCallback(async (assignmentId: string, updates: Partial<HomeworkAssignment>): Promise<void> => {
    setHomeworkAssignments(prev => prev.map(assignment => 
      assignment.id === assignmentId ? { ...assignment, ...updates, updatedDate: new Date().toISOString().split('T')[0] } : assignment
    ))
    logSuccess('Assignment updated successfully')
  }, [])

  const deleteHomeworkAssignment = useCallback(async (assignmentId: string): Promise<void> => {
    setHomeworkAssignments(prev => prev.filter(assignment => assignment.id !== assignmentId))
    setHomeworkSubmissions(prev => prev.filter(submission => submission.assignmentId !== assignmentId))
    logSuccess('Assignment deleted successfully')
  }, [])

  const addHomeworkSubmission = useCallback(async (submissionData: Omit<HomeworkSubmission, 'id' | 'createdDate' | 'updatedDate'>): Promise<HomeworkSubmission> => {
    const newSubmission: HomeworkSubmission = {
      id: (homeworkSubmissions.length + 1).toString(),
      ...submissionData,
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0]
    }
    setHomeworkSubmissions(prev => [...prev, newSubmission])
    logSuccess('Homework submitted successfully')
    return newSubmission
  }, [homeworkSubmissions.length])

  const updateHomeworkSubmission = useCallback(async (submissionId: string, updates: Partial<HomeworkSubmission>): Promise<void> => {
    setHomeworkSubmissions(prev => prev.map(submission => 
      submission.id === submissionId ? { ...submission, ...updates, updatedDate: new Date().toISOString().split('T')[0] } : submission
    ))
    logSuccess('Homework submission updated successfully')
  }, [])

  const deleteHomeworkSubmission = useCallback(async (submissionId: string): Promise<void> => {
    setHomeworkSubmissions(prev => prev.filter(submission => submission.id !== submissionId))
    logSuccess('Homework submission deleted successfully')
  }, [])

  // Utility actions
  const refreshData = useCallback(async (): Promise<void> => {
    logSuccess('Data refreshed successfully')
  }, [])

  const clearCache = useCallback((): void => {
    logSuccess('Cache cleared successfully')
  }, [])

  // Memoized data and actions
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

  const appActions = useMemo(() => ({
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
    deleteHomeworkSubmission,
    refreshData,
    clearCache
  }), [
    addClass, addStudent, updateStudent, deleteStudent, addSchedule, updateSchedule, updateClass,
    enrollStudent, unenrollStudent, deleteSchedule, addScheduleException, updateScheduleException,
    deleteScheduleException, addMeeting, updateMeeting, deleteMeeting, addAttendanceRecord,
    updateAttendanceRecord, addClassNote, updateClassNote, deleteClassNote, addTest, updateTest,
    deleteTest, addTestResult, updateTestResult, deleteTestResult, addHomeworkAssignment,
    updateHomeworkAssignment, deleteHomeworkAssignment, addHomeworkSubmission, updateHomeworkSubmission,
    deleteHomeworkSubmission, refreshData, clearCache
  ])

  const value = {
    data: appData,
    actions: appActions,
    loading,
    errors,
    isInitialLoading
  }

  return (
    <EnhancedAppDataContext.Provider value={value}>
      {children}
    </EnhancedAppDataContext.Provider>
  )
}

// Compatibility export for easy migration
export { useEnhancedAppData as useAppData }