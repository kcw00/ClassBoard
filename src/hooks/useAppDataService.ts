import { useState, useEffect, useCallback, useMemo } from 'react'
import { appDataService, ApiError, NetworkError } from '@/services/AppDataService'
import type {
  Class,
  Student,
  Schedule,
  ScheduleException,
  Meeting,
  AttendanceRecord,
  ClassNote,
  Test,
  TestResult,
  HomeworkAssignment,
  HomeworkSubmission
} from '@/types'

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
  addClass?: string
  addStudent?: string
  updateStudent?: string
  deleteStudent?: string
  updateClass?: string
  enrollStudent?: string
  unenrollStudent?: string
  addSchedule?: string
  updateSchedule?: string
  deleteSchedule?: string
  addScheduleException?: string
  updateScheduleException?: string
  deleteScheduleException?: string
  addMeeting?: string
  updateMeeting?: string
  deleteMeeting?: string
  addAttendanceRecord?: string
  updateAttendanceRecord?: string
  addClassNote?: string
  updateClassNote?: string
  deleteClassNote?: string
  addTest?: string
  updateTest?: string
  deleteTest?: string
  addTestResult?: string
  updateTestResult?: string
  deleteTestResult?: string
  addHomeworkAssignment?: string
  updateHomeworkAssignment?: string
  deleteHomeworkAssignment?: string
  addHomeworkSubmission?: string
  updateHomeworkSubmission?: string
  deleteHomeworkSubmission?: string
}

interface AppActions {
  addClass: (classData: Omit<Class, 'id' | 'createdDate' | 'enrolledStudents'>) => Promise<Class>
  updateClass: (classId: string, updates: Partial<Class>) => Promise<void>
  deleteClass: (classId: string) => Promise<void>
  addStudent: (studentData: Omit<Student, 'id' | 'enrollmentDate'>) => Promise<Student>
  updateStudent: (studentId: string, updates: Partial<Student>) => Promise<void>
  deleteStudent: (studentId: string) => Promise<void>
  addSchedule: (scheduleData: Omit<Schedule, 'id'>) => Promise<Schedule>
  updateSchedule: (scheduleId: string, updates: Partial<Schedule>) => Promise<void>
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

interface UseAppDataServiceReturn {
  data: AppData
  actions: AppActions
  loading: LoadingStates
  errors: ErrorStates
  isInitialLoading: boolean
}

export function useAppDataService(): UseAppDataServiceReturn {
  // Data state
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

  // Loading state
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

  // Error state
  const [errors, setErrors] = useState<ErrorStates>({})

  // Initial loading state
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // Helper function to handle errors
  const handleError = useCallback((operation: keyof ErrorStates, error: unknown) => {
    console.error(`Error in ${operation}:`, error)

    let errorMessage = 'An unexpected error occurred'

    if (error instanceof ApiError) {
      errorMessage = error.message
    } else if (error instanceof NetworkError) {
      errorMessage = 'Network connection failed. Please check your internet connection.'
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    setErrors(prev => ({ ...prev, [operation]: errorMessage }))

    // Clear error after 5 seconds
    setTimeout(() => {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[operation]
        return newErrors
      })
    }, 5000)
  }, [])

  // Helper function to set loading state
  const setLoadingState = useCallback((operation: keyof LoadingStates, isLoading: boolean) => {
    setLoading(prev => ({ ...prev, [operation]: isLoading }))
  }, [])

  // Data fetching functions
  const fetchClasses = useCallback(async () => {
    setLoadingState('classes', true)
    try {
      const data = await appDataService.getClasses()
      setClasses(data)
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.classes
        return newErrors
      })
    } catch (error) {
      handleError('classes', error)
    } finally {
      setLoadingState('classes', false)
    }
  }, [setLoadingState, handleError])

  const fetchStudents = useCallback(async () => {
    setLoadingState('students', true)
    try {
      const data = await appDataService.getStudents()
      setStudents(data)
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.students
        return newErrors
      })
    } catch (error) {
      handleError('students', error)
    } finally {
      setLoadingState('students', false)
    }
  }, [setLoadingState, handleError])

  const fetchSchedules = useCallback(async () => {
    setLoadingState('schedules', true)
    try {
      // Since backend doesn't have "get all schedules", we need to get schedules for each class
      const allSchedules: Schedule[] = []
      
      // Get current classes first
      const currentClasses = classes.length > 0 ? classes : await appDataService.getClasses()
      
      // Fetch schedules for each class
      for (const classItem of currentClasses) {
        try {
          const classSchedules = await appDataService.getSchedulesByClass(classItem.id)
          allSchedules.push(...classSchedules)
        } catch (error) {
          console.warn(`Failed to fetch schedules for class ${classItem.id}:`, error)
        }
      }
      
      setSchedules(allSchedules)
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.schedules
        return newErrors
      })
    } catch (error) {
      handleError('schedules', error)
    } finally {
      setLoadingState('schedules', false)
    }
  }, [classes, setLoadingState, handleError])

  const fetchScheduleExceptions = useCallback(async () => {
    setLoadingState('scheduleExceptions', true)
    try {
      const data = await appDataService.getScheduleExceptions()
      setScheduleExceptions(data)
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.scheduleExceptions
        return newErrors
      })
    } catch (error) {
      handleError('scheduleExceptions', error)
    } finally {
      setLoadingState('scheduleExceptions', false)
    }
  }, [setLoadingState, handleError])

  const fetchMeetings = useCallback(async () => {
    setLoadingState('meetings', true)
    try {
      const data = await appDataService.getMeetings()
      setMeetings(data)
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.meetings
        return newErrors
      })
    } catch (error) {
      handleError('meetings', error)
    } finally {
      setLoadingState('meetings', false)
    }
  }, [setLoadingState, handleError])

  const fetchAttendanceRecords = useCallback(async () => {
    setLoadingState('attendanceRecords', true)
    try {
      const data = await appDataService.getAttendanceRecords()
      setAttendanceRecords(data)
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.attendanceRecords
        return newErrors
      })
    } catch (error) {
      handleError('attendanceRecords', error)
    } finally {
      setLoadingState('attendanceRecords', false)
    }
  }, [setLoadingState, handleError])

  const fetchClassNotes = useCallback(async () => {
    setLoadingState('classNotes', true)
    try {
      const data = await appDataService.getClassNotes()
      setClassNotes(data)
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.classNotes
        return newErrors
      })
    } catch (error) {
      handleError('classNotes', error)
    } finally {
      setLoadingState('classNotes', false)
    }
  }, [setLoadingState, handleError])

  const fetchTests = useCallback(async () => {
    setLoadingState('tests', true)
    try {
      const data = await appDataService.getTests()
      setTests(data)
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.tests
        return newErrors
      })
    } catch (error) {
      handleError('tests', error)
    } finally {
      setLoadingState('tests', false)
    }
  }, [setLoadingState, handleError])

  const fetchTestResults = useCallback(async () => {
    setLoadingState('testResults', true)
    try {
      const data = await appDataService.getTestResults()
      setTestResults(data)
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.testResults
        return newErrors
      })
    } catch (error) {
      handleError('testResults', error)
    } finally {
      setLoadingState('testResults', false)
    }
  }, [setLoadingState, handleError])

  const fetchHomeworkAssignments = useCallback(async () => {
    setLoadingState('homeworkAssignments', true)
    try {
      const data = await appDataService.getHomeworkAssignments()
      setHomeworkAssignments(data)
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.homeworkAssignments
        return newErrors
      })
    } catch (error) {
      handleError('homeworkAssignments', error)
    } finally {
      setLoadingState('homeworkAssignments', false)
    }
  }, [setLoadingState, handleError])

  const fetchHomeworkSubmissions = useCallback(async () => {
    setLoadingState('homeworkSubmissions', true)
    try {
      const data = await appDataService.getHomeworkSubmissions()
      setHomeworkSubmissions(data)
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.homeworkSubmissions
        return newErrors
      })
    } catch (error) {
      handleError('homeworkSubmissions', error)
    } finally {
      setLoadingState('homeworkSubmissions', false)
    }
  }, [setLoadingState, handleError])

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true)
      try {
        await Promise.all([
          fetchClasses(),
          fetchStudents(),
          fetchSchedules(),
          fetchScheduleExceptions(),
          fetchMeetings(),
          fetchAttendanceRecords(),
          fetchClassNotes(),
          fetchTests(),
          fetchTestResults(),
          fetchHomeworkAssignments(),
          fetchHomeworkSubmissions()
        ])
      } finally {
        setIsInitialLoading(false)
      }
    }

    loadInitialData()
  }, [
    fetchClasses,
    fetchStudents,
    fetchSchedules,
    fetchScheduleExceptions,
    fetchMeetings,
    fetchAttendanceRecords,
    fetchClassNotes,
    fetchTests,
    fetchTestResults,
    fetchHomeworkAssignments,
    fetchHomeworkSubmissions
  ])

  // Action implementations with optimistic updates
  const addClass = useCallback(async (classData: Omit<Class, 'id' | 'createdDate' | 'enrolledStudents'>): Promise<Class> => {
    const tempId = `temp-${Date.now()}`
    const optimisticClass: Class = {
      id: tempId,
      ...classData,
      capacity: parseInt(classData.capacity.toString()),
      enrolledStudents: [],
      createdDate: new Date().toISOString().split('T')[0]
    }

    // Optimistic update
    setClasses(prev => [...prev, optimisticClass])

    try {
      const newClass = await appDataService.addClass(classData)

      // Replace optimistic update with real data
      setClasses(prev => prev.map(c => c.id === tempId ? newClass : c))

      return newClass
    } catch (error) {
      // Revert optimistic update
      setClasses(prev => prev.filter(c => c.id !== tempId))
      handleError('addClass', error)
      throw error
    }
  }, [handleError])

  const addStudent = useCallback(async (studentData: Omit<Student, 'id' | 'enrollmentDate'>): Promise<Student> => {
    const tempId = `temp-${Date.now()}`
    const optimisticStudent: Student = {
      id: tempId,
      ...studentData,
      enrollmentDate: new Date().toISOString().split('T')[0]
    }

    // Optimistic update
    setStudents(prev => [...prev, optimisticStudent])

    try {
      const newStudent = await appDataService.addStudent(studentData)

      // Replace optimistic update with real data
      setStudents(prev => prev.map(s => s.id === tempId ? newStudent : s))

      return newStudent
    } catch (error) {
      // Revert optimistic update
      setStudents(prev => prev.filter(s => s.id !== tempId))
      handleError('addStudent', error)
      throw error
    }
  }, [handleError])

  const updateStudent = useCallback(async (studentId: string, updates: Partial<Student>): Promise<void> => {
    const originalStudent = students.find(s => s.id === studentId)
    if (!originalStudent) return

    // Optimistic update
    const updatedStudent = { ...originalStudent, ...updates }
    setStudents(prev => prev.map(s => s.id === studentId ? updatedStudent : s))

    try {
      await appDataService.updateStudent(studentId, updates)
    } catch (error) {
      // Revert optimistic update
      setStudents(prev => prev.map(s => s.id === studentId ? originalStudent : s))
      handleError('updateStudent', error)
      throw error
    }
  }, [students, handleError])

  const deleteStudent = useCallback(async (studentId: string): Promise<void> => {
    const originalStudent = students.find(s => s.id === studentId)
    if (!originalStudent) return

    // Optimistic update
    setStudents(prev => prev.filter(s => s.id !== studentId))

    // Also remove from class enrollments
    setClasses(prev => prev.map(c => ({
      ...c,
      enrolledStudents: c.enrolledStudents.filter(id => id !== studentId)
    })))

    // Remove from attendance records
    setAttendanceRecords(prev => prev.map(record => ({
      ...record,
      attendanceData: record.attendanceData.filter(entry => entry.studentId !== studentId)
    })))

    try {
      await appDataService.deleteStudent(studentId)
    } catch (error) {
      // Revert optimistic update
      setStudents(prev => [...prev, originalStudent])
      handleError('deleteStudent', error)
      throw error
    }
  }, [students, handleError])

  // Continue with other action implementations...
  // For brevity, I'll implement a few more key ones and provide the pattern

  const updateClass = useCallback(async (classId: string, updates: Partial<Class>): Promise<void> => {
    const originalClass = classes.find(c => c.id === classId)
    if (!originalClass) return

    const updatedClass = { ...originalClass, ...updates }
    setClasses(prev => prev.map(c => c.id === classId ? updatedClass : c))

    try {
      await appDataService.updateClass(classId, updates)
    } catch (error) {
      setClasses(prev => prev.map(c => c.id === classId ? originalClass : c))
      handleError('updateClass', error)
      throw error
    }
  }, [classes, handleError])

  const deleteClass = useCallback(async (classId: string): Promise<void> => {
    const originalClass = classes.find(c => c.id === classId)
    if (!originalClass) return

    // Optimistically remove the class from the UI
    setClasses(prev => prev.filter(c => c.id !== classId))

    try {
      await appDataService.deleteClass(classId)
    } catch (error) {
      // Revert optimistic update
      setClasses(prev => [...prev, originalClass])
      handleError('deleteClass', error)
      throw error
    }
  }, [classes, handleError])

  const enrollStudent = useCallback(async (classId: string, studentId: string): Promise<void> => {
    const originalClass = classes.find(c => c.id === classId)
    if (!originalClass) return

    const updatedClass = {
      ...originalClass,
      enrolledStudents: originalClass.enrolledStudents.includes(studentId)
        ? originalClass.enrolledStudents
        : [...originalClass.enrolledStudents, studentId]
    }

    setClasses(prev => prev.map(c => c.id === classId ? updatedClass : c))

    try {
      await appDataService.enrollStudent(classId, studentId)
    } catch (error) {
      setClasses(prev => prev.map(c => c.id === classId ? originalClass : c))
      handleError('enrollStudent', error)
      throw error
    }
  }, [classes, handleError])

  const unenrollStudent = useCallback(async (classId: string, studentId: string): Promise<void> => {
    const originalClass = classes.find(c => c.id === classId)
    if (!originalClass) return

    const updatedClass = {
      ...originalClass,
      enrolledStudents: originalClass.enrolledStudents.filter(id => id !== studentId)
    }

    setClasses(prev => prev.map(c => c.id === classId ? updatedClass : c))

    try {
      await appDataService.unenrollStudent(classId, studentId)
    } catch (error) {
      setClasses(prev => prev.map(c => c.id === classId ? originalClass : c))
      handleError('unenrollStudent', error)
      throw error
    }
  }, [classes, handleError])

  // Utility actions
  const refreshData = useCallback(async (): Promise<void> => {
    await Promise.all([
      fetchClasses(),
      fetchStudents(),
      fetchSchedules(),
      fetchScheduleExceptions(),
      fetchMeetings(),
      fetchAttendanceRecords(),
      fetchClassNotes(),
      fetchTests(),
      fetchTestResults(),
      fetchHomeworkAssignments(),
      fetchHomeworkSubmissions()
    ])
  }, [
    fetchClasses,
    fetchStudents,
    fetchSchedules,
    fetchScheduleExceptions,
    fetchMeetings,
    fetchAttendanceRecords,
    fetchClassNotes,
    fetchTests,
    fetchTestResults,
    fetchHomeworkAssignments,
    fetchHomeworkSubmissions
  ])

  const clearCache = useCallback((): void => {
    appDataService.clearCache()
  }, [])

  // Placeholder implementations for remaining actions
  // These follow the same pattern as above
  const addSchedule = useCallback(async (scheduleData: Omit<Schedule, 'id'>): Promise<Schedule> => {
    const tempId = `temp-${Date.now()}`
    const optimisticSchedule: Schedule = {
      id: tempId,
      ...scheduleData
    }

    // Optimistic update
    setSchedules(prev => [...prev, optimisticSchedule])

    try {
      const newSchedule = await appDataService.addSchedule(scheduleData)

      // Replace optimistic update with real data
      setSchedules(prev => prev.map(s => s.id === tempId ? newSchedule : s))

      return newSchedule
    } catch (error) {
      // Revert optimistic update
      setSchedules(prev => prev.filter(s => s.id !== tempId))
      handleError('addSchedule', error)
      throw error
    }
  }, [handleError])

  const updateSchedule = useCallback(async (scheduleId: string, updates: Partial<Schedule>): Promise<void> => {
    const originalSchedule = schedules.find(s => s.id === scheduleId)
    if (!originalSchedule) return

    // Optimistic update
    const updatedSchedule = { ...originalSchedule, ...updates }
    setSchedules(prev => prev.map(s => s.id === scheduleId ? updatedSchedule : s))

    try {
      await appDataService.updateSchedule(scheduleId, updates)
    } catch (error) {
      // Revert optimistic update
      setSchedules(prev => prev.map(s => s.id === scheduleId ? originalSchedule : s))
      handleError('updateSchedule', error)
      throw error
    }
  }, [schedules, handleError])

  const deleteSchedule = useCallback(async (scheduleId: string): Promise<void> => {
    const originalSchedule = schedules.find(s => s.id === scheduleId)
    if (!originalSchedule) return

    // Optimistic update
    setSchedules(prev => prev.filter(s => s.id !== scheduleId))

    try {
      await appDataService.deleteSchedule(scheduleId)
    } catch (error) {
      // Revert optimistic update
      setSchedules(prev => [...prev, originalSchedule])
      handleError('deleteSchedule', error)
      throw error
    }
  }, [schedules, handleError])

  const addScheduleException = useCallback(async (exceptionData: Omit<ScheduleException, 'id' | 'createdDate'>): Promise<ScheduleException> => {
    const tempId = `temp-${Date.now()}`
    const optimisticException: ScheduleException = {
      id: tempId,
      ...exceptionData,
      createdDate: new Date().toISOString().split('T')[0]
    }

    // Optimistic update
    setScheduleExceptions(prev => [...prev, optimisticException])

    try {
      const newException = await appDataService.addScheduleException(exceptionData)

      // Replace optimistic update with real data
      setScheduleExceptions(prev => prev.map(e => e.id === tempId ? newException : e))

      return newException
    } catch (error) {
      // Remove optimistic update on error
      setScheduleExceptions(prev => prev.filter(e => e.id !== tempId))
      handleError('addScheduleException', error)
      throw error
    }
  }, [handleError])

  const updateScheduleException = useCallback(async (exceptionId: string, updates: Partial<ScheduleException>): Promise<void> => {
    const originalException = scheduleExceptions.find(e => e.id === exceptionId)
    if (!originalException) return

    // Optimistic update
    const updatedException = { ...originalException, ...updates }
    setScheduleExceptions(prev => prev.map(e => e.id === exceptionId ? updatedException : e))

    try {
      await appDataService.updateScheduleException(exceptionId, updates)
    } catch (error) {
      // Revert optimistic update
      setScheduleExceptions(prev => prev.map(e => e.id === exceptionId ? originalException : e))
      handleError('updateScheduleException', error)
      throw error
    }
  }, [scheduleExceptions, handleError])

  const deleteScheduleException = useCallback(async (exceptionId: string): Promise<void> => {
    await appDataService.deleteScheduleException(exceptionId)
    await fetchScheduleExceptions()
  }, [fetchScheduleExceptions])

  const addMeeting = useCallback(async (meetingData: Omit<Meeting, 'id' | 'createdDate'>): Promise<Meeting> => {
    const tempId = `temp-${Date.now()}`
    const currentDate = new Date().toISOString().split('T')[0]
    const optimisticMeeting: Meeting = {
      id: tempId,
      ...meetingData,
      createdDate: currentDate
    }

    // Optimistic update
    setMeetings(prev => [...prev, optimisticMeeting])

    try {
      const newMeeting = await appDataService.addMeeting(meetingData)

      // Replace optimistic update with real data
      setMeetings(prev => prev.map(m => m.id === tempId ? newMeeting : m))

      return newMeeting
    } catch (error) {
      // Revert optimistic update
      setMeetings(prev => prev.filter(m => m.id !== tempId))
      handleError('addMeeting', error)
      throw error
    }
  }, [handleError])

  const updateMeeting = useCallback(async (meetingId: string, updates: Partial<Meeting>): Promise<void> => {
    const originalMeeting = meetings.find(m => m.id === meetingId)
    if (!originalMeeting) return

    // Optimistic update
    const updatedMeeting = { ...originalMeeting, ...updates }
    setMeetings(prev => prev.map(m => m.id === meetingId ? updatedMeeting : m))

    try {
      await appDataService.updateMeeting(meetingId, updates)
    } catch (error) {
      // Revert optimistic update
      setMeetings(prev => prev.map(m => m.id === meetingId ? originalMeeting : m))
      handleError('updateMeeting', error)
      throw error
    }
  }, [meetings, handleError])

  const deleteMeeting = useCallback(async (meetingId: string): Promise<void> => {
    const originalMeeting = meetings.find(m => m.id === meetingId)

    // Optimistic update
    setMeetings(prev => prev.filter(m => m.id !== meetingId))

    try {
      await appDataService.deleteMeeting(meetingId)
    } catch (error) {
      // Revert optimistic update
      if (originalMeeting) {
        setMeetings(prev => [...prev, originalMeeting])
      }
      handleError('deleteMeeting', error)
      throw error
    }
  }, [meetings, handleError])

  const addAttendanceRecord = useCallback(async (attendanceData: Omit<AttendanceRecord, 'id' | 'createdDate'>): Promise<AttendanceRecord> => {
    const tempId = `temp-${Date.now()}`
    const optimisticRecord: AttendanceRecord = {
      id: tempId,
      ...attendanceData,
      createdDate: new Date().toISOString().split('T')[0]
    }

    // Optimistic update
    setAttendanceRecords(prev => [...prev, optimisticRecord])

    try {
      const newRecord = await appDataService.addAttendanceRecord(attendanceData)

      // Replace optimistic update with real data
      setAttendanceRecords(prev => prev.map(r => r.id === tempId ? newRecord : r))

      return newRecord
    } catch (error) {
      // Revert optimistic update
      setAttendanceRecords(prev => prev.filter(r => r.id !== tempId))
      handleError('addAttendanceRecord', error)
      throw error
    }
  }, [handleError])

  const updateAttendanceRecord = useCallback(async (attendanceId: string, updates: Partial<AttendanceRecord>): Promise<void> => {
    const originalRecord = attendanceRecords.find(r => r.id === attendanceId)
    if (!originalRecord) return

    // Optimistic update
    const updatedRecord = { ...originalRecord, ...updates }
    setAttendanceRecords(prev => prev.map(r => r.id === attendanceId ? updatedRecord : r))

    try {
      await appDataService.updateAttendanceRecord(attendanceId, updates)
    } catch (error) {
      // Revert optimistic update
      setAttendanceRecords(prev => prev.map(r => r.id === attendanceId ? originalRecord : r))
      handleError('updateAttendanceRecord', error)
      throw error
    }
  }, [attendanceRecords, handleError])

  const addClassNote = useCallback(async (noteData: Omit<ClassNote, 'id' | 'createdDate' | 'updatedDate'>): Promise<ClassNote> => {
    const tempId = `temp-${Date.now()}`
    const optimisticNote: ClassNote = {
      id: tempId,
      ...noteData,
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0]
    }

    // Optimistic update
    setClassNotes(prev => [...prev, optimisticNote])

    try {
      const newNote = await appDataService.addClassNote(noteData)

      // Replace optimistic update with real data
      setClassNotes(prev => prev.map(n => n.id === tempId ? newNote : n))

      return newNote
    } catch (error) {
      // Revert optimistic update
      setClassNotes(prev => prev.filter(n => n.id !== tempId))
      handleError('addClassNote', error)
      throw error
    }
  }, [handleError])

  const updateClassNote = useCallback(async (noteId: string, updates: Partial<ClassNote>): Promise<void> => {
    const originalNote = classNotes.find(n => n.id === noteId)
    if (!originalNote) return

    // Optimistic update
    const updatedNote = { ...originalNote, ...updates, updatedDate: new Date().toISOString().split('T')[0] }
    setClassNotes(prev => prev.map(n => n.id === noteId ? updatedNote : n))

    try {
      await appDataService.updateClassNote(noteId, updates)
    } catch (error) {
      // Revert optimistic update
      setClassNotes(prev => prev.map(n => n.id === noteId ? originalNote : n))
      handleError('updateClassNote', error)
      throw error
    }
  }, [classNotes, handleError])

  const deleteClassNote = useCallback(async (noteId: string): Promise<void> => {
    const originalNote = classNotes.find(n => n.id === noteId)
    if (!originalNote) return

    // Optimistic update
    setClassNotes(prev => prev.filter(n => n.id !== noteId))

    try {
      await appDataService.deleteClassNote(noteId)
    } catch (error) {
      // Revert optimistic update
      setClassNotes(prev => [...prev, originalNote])
      handleError('deleteClassNote', error)
      throw error
    }
  }, [classNotes, handleError])

  const addTest = useCallback(async (testData: Omit<Test, 'id' | 'createdDate' | 'updatedDate'>): Promise<Test> => {
    const tempId = `temp-${Date.now()}`
    const currentDate = new Date().toISOString().split('T')[0]
    const optimisticTest: Test = {
      id: tempId,
      ...testData,
      createdDate: currentDate,
      updatedDate: currentDate
    }

    // Optimistic update
    setTests(prev => [...prev, optimisticTest])

    try {
      const newTest = await appDataService.addTest(testData)

      // Replace optimistic update with real data
      setTests(prev => prev.map(t => t.id === tempId ? newTest : t))

      return newTest
    } catch (error) {
      // Revert optimistic update
      setTests(prev => prev.filter(t => t.id !== tempId))
      handleError('addTest', error)
      throw error
    }
  }, [handleError])

  const updateTest = useCallback(async (testId: string, updates: Partial<Test>): Promise<void> => {
    const originalTest = tests.find(t => t.id === testId)
    if (!originalTest) return

    // Optimistic update
    const updatedTest = { ...originalTest, ...updates }
    setTests(prev => prev.map(t => t.id === testId ? updatedTest : t))

    try {
      await appDataService.updateTest(testId, updates)
    } catch (error) {
      // Revert optimistic update
      setTests(prev => prev.map(t => t.id === testId ? originalTest : t))
      handleError('updateTest', error)
      throw error
    }
  }, [tests, handleError])

  const deleteTest = useCallback(async (testId: string): Promise<void> => {
    const originalTest = tests.find(t => t.id === testId)
    const originalResults = testResults.filter(r => r.testId === testId)

    // Optimistic update - remove test and its results
    setTests(prev => prev.filter(t => t.id !== testId))
    setTestResults(prev => prev.filter(r => r.testId !== testId))

    try {
      await appDataService.deleteTest(testId)
    } catch (error) {
      // Revert optimistic update
      if (originalTest) {
        setTests(prev => [...prev, originalTest])
      }
      setTestResults(prev => [...prev, ...originalResults])
      handleError('deleteTest', error)
      throw error
    }
  }, [tests, testResults, handleError])

  const addTestResult = useCallback(async (resultData: Omit<TestResult, 'id' | 'createdDate' | 'updatedDate'>): Promise<TestResult> => {
    const tempId = `temp-${Date.now()}`
    const currentDate = new Date().toISOString().split('T')[0]
    const optimisticResult: TestResult = {
      id: tempId,
      ...resultData,
      createdDate: currentDate,
      updatedDate: currentDate
    }

    // Optimistic update
    setTestResults(prev => [...prev, optimisticResult])

    try {
      const newResult = await appDataService.addTestResult(resultData)

      // Replace optimistic update with real data
      setTestResults(prev => prev.map(r => r.id === tempId ? newResult : r))

      return newResult
    } catch (error) {
      // Revert optimistic update
      setTestResults(prev => prev.filter(r => r.id !== tempId))
      handleError('addTestResult', error)
      throw error
    }
  }, [handleError])

  const updateTestResult = useCallback(async (resultId: string, updates: Partial<TestResult>): Promise<void> => {
    const originalResult = testResults.find(r => r.id === resultId)
    if (!originalResult) return

    // Optimistic update
    const updatedResult = { ...originalResult, ...updates }
    setTestResults(prev => prev.map(r => r.id === resultId ? updatedResult : r))

    try {
      await appDataService.updateTestResult(resultId, updates)
    } catch (error) {
      // Revert optimistic update
      setTestResults(prev => prev.map(r => r.id === resultId ? originalResult : r))
      handleError('updateTestResult', error)
      throw error
    }
  }, [testResults, handleError])

  const deleteTestResult = useCallback(async (resultId: string): Promise<void> => {
    const originalResult = testResults.find(r => r.id === resultId)

    // Optimistic update
    setTestResults(prev => prev.filter(r => r.id !== resultId))

    try {
      await appDataService.deleteTestResult(resultId)
    } catch (error) {
      // Revert optimistic update
      if (originalResult) {
        setTestResults(prev => [...prev, originalResult])
      }
      handleError('deleteTestResult', error)
      throw error
    }
  }, [fetchTestResults])

  const addHomeworkAssignment = useCallback(async (assignmentData: Omit<HomeworkAssignment, 'id' | 'createdDate' | 'updatedDate'>): Promise<HomeworkAssignment> => {
    return appDataService.addHomeworkAssignment(assignmentData)
  }, [])

  const updateHomeworkAssignment = useCallback(async (assignmentId: string, updates: Partial<HomeworkAssignment>): Promise<void> => {
    await appDataService.updateHomeworkAssignment(assignmentId, updates)
    await fetchHomeworkAssignments()
  }, [fetchHomeworkAssignments])

  const deleteHomeworkAssignment = useCallback(async (assignmentId: string): Promise<void> => {
    await appDataService.deleteHomeworkAssignment(assignmentId)
    await fetchHomeworkAssignments()
    await fetchHomeworkSubmissions() // Also refresh submissions
  }, [fetchHomeworkAssignments, fetchHomeworkSubmissions])

  const addHomeworkSubmission = useCallback(async (submissionData: Omit<HomeworkSubmission, 'id' | 'createdDate' | 'updatedDate'>): Promise<HomeworkSubmission> => {
    return appDataService.addHomeworkSubmission(submissionData)
  }, [])

  const updateHomeworkSubmission = useCallback(async (submissionId: string, updates: Partial<HomeworkSubmission>): Promise<void> => {
    await appDataService.updateHomeworkSubmission(submissionId, updates)
    await fetchHomeworkSubmissions()
  }, [fetchHomeworkSubmissions])

  const deleteHomeworkSubmission = useCallback(async (submissionId: string): Promise<void> => {
    await appDataService.deleteHomeworkSubmission(submissionId)
    await fetchHomeworkSubmissions()
  }, [fetchHomeworkSubmissions])

  // Memoized data and actions
  const data = useMemo(() => ({
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
  }), [
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
  ])

  const actions = useMemo(() => ({
    addClass,
    updateClass,
    deleteClass,
    addStudent,
    updateStudent,
    deleteStudent,
    addSchedule,
    updateSchedule,
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
    addClass,
    updateClass,
    deleteClass,
    addStudent,
    updateStudent,
    deleteStudent,
    addSchedule,
    updateSchedule,
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
  ])

  return {
    data,
    actions,
    loading,
    errors,
    isInitialLoading
  }
}