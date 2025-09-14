import React, { createContext, useContext, ReactNode } from 'react'
import { useAppDataService } from '@/hooks/useAppDataService'
import {
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
} from '@/data/mockData'

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

interface AppDataServiceContextType {
  data: AppData
  actions: AppActions
  loading: LoadingStates
  errors: ErrorStates
  isInitialLoading: boolean
}

const AppDataServiceContext = createContext<AppDataServiceContextType | undefined>(undefined)

export function useAppDataService() {
  const context = useContext(AppDataServiceContext)
  if (context === undefined) {
    throw new Error('useAppDataService must be used within an AppDataServiceProvider')
  }
  return context
}

interface AppDataServiceProviderProps {
  children: ReactNode
}

export function AppDataServiceProvider({ children }: AppDataServiceProviderProps) {
  const serviceData = useAppDataService()

  return (
    <AppDataServiceContext.Provider value={serviceData}>
      {children}
    </AppDataServiceContext.Provider>
  )
}

// Compatibility hook that matches the original AppDataContext interface
export function useAppData() {
  const { data, actions, loading, errors, isInitialLoading } = useAppDataService()
  
  // Transform the async actions to match the original synchronous interface
  // This provides backward compatibility during the migration
  const compatibilityActions = {
    addClass: (classData: Omit<Class, 'id' | 'createdDate' | 'enrolledStudents'>) => {
      actions.addClass(classData).catch(console.error)
      // Return a temporary class for immediate UI updates
      return {
        id: `temp-${Date.now()}`,
        ...classData,
        capacity: parseInt(classData.capacity.toString()),
        enrolledStudents: [],
        createdDate: new Date().toISOString().split('T')[0]
      } as Class
    },
    
    addStudent: (studentData: Omit<Student, 'id' | 'enrollmentDate'>) => {
      actions.addStudent(studentData).catch(console.error)
      // Return a temporary student for immediate UI updates
      return {
        id: `temp-${Date.now()}`,
        ...studentData,
        enrollmentDate: new Date().toISOString().split('T')[0]
      } as Student
    },
    
    updateStudent: (studentId: string, updates: Partial<Student>) => {
      actions.updateStudent(studentId, updates).catch(console.error)
    },
    
    deleteStudent: (studentId: string) => {
      actions.deleteStudent(studentId).catch(console.error)
    },
    
    addSchedule: (scheduleData: Omit<Schedule, 'id'>) => {
      actions.addSchedule(scheduleData).catch(console.error)
      // Return a temporary schedule for immediate UI updates
      return {
        id: `temp-${Date.now()}`,
        ...scheduleData,
        dayOfWeek: parseInt(scheduleData.dayOfWeek.toString())
      } as Schedule
    },
    
    updateSchedule: (scheduleId: string, updates: Partial<Schedule>) => {
      actions.updateSchedule(scheduleId, updates).catch(console.error)
    },
    
    updateClass: (classId: string, updates: Partial<Class>) => {
      actions.updateClass(classId, updates).catch(console.error)
    },
    
    enrollStudent: (classId: string, studentId: string) => {
      actions.enrollStudent(classId, studentId).catch(console.error)
    },
    
    unenrollStudent: (classId: string, studentId: string) => {
      actions.unenrollStudent(classId, studentId).catch(console.error)
    },
    
    deleteSchedule: (scheduleId: string) => {
      actions.deleteSchedule(scheduleId).catch(console.error)
    },
    
    addScheduleException: (exceptionData: Omit<ScheduleException, 'id' | 'createdDate'>) => {
      actions.addScheduleException(exceptionData).catch(console.error)
      // Return a temporary exception for immediate UI updates
      return {
        id: `temp-${Date.now()}`,
        ...exceptionData,
        createdDate: new Date().toISOString().split('T')[0]
      } as ScheduleException
    },
    
    updateScheduleException: (exceptionId: string, updates: Partial<ScheduleException>) => {
      actions.updateScheduleException(exceptionId, updates).catch(console.error)
    },
    
    deleteScheduleException: (exceptionId: string) => {
      actions.deleteScheduleException(exceptionId).catch(console.error)
    },
    
    addMeeting: (meetingData: Omit<Meeting, 'id' | 'createdDate'>) => {
      actions.addMeeting(meetingData).catch(console.error)
      // Return a temporary meeting for immediate UI updates
      return {
        id: `temp-${Date.now()}`,
        ...meetingData,
        createdDate: new Date().toISOString().split('T')[0]
      } as Meeting
    },
    
    updateMeeting: (meetingId: string, updates: Partial<Meeting>) => {
      actions.updateMeeting(meetingId, updates).catch(console.error)
    },
    
    deleteMeeting: (meetingId: string) => {
      actions.deleteMeeting(meetingId).catch(console.error)
    },
    
    addAttendanceRecord: (attendanceData: Omit<AttendanceRecord, 'id' | 'createdDate'>) => {
      actions.addAttendanceRecord(attendanceData).catch(console.error)
      // Return a temporary record for immediate UI updates
      return {
        id: `temp-${Date.now()}`,
        ...attendanceData,
        createdDate: new Date().toISOString().split('T')[0]
      } as AttendanceRecord
    },
    
    updateAttendanceRecord: (attendanceId: string, updates: Partial<AttendanceRecord>) => {
      actions.updateAttendanceRecord(attendanceId, updates).catch(console.error)
    },
    
    addClassNote: (noteData: Omit<ClassNote, 'id' | 'createdDate' | 'updatedDate'>) => {
      actions.addClassNote(noteData).catch(console.error)
      // Return a temporary note for immediate UI updates
      return {
        id: `temp-${Date.now()}`,
        ...noteData,
        createdDate: new Date().toISOString().split('T')[0],
        updatedDate: new Date().toISOString().split('T')[0]
      } as ClassNote
    },
    
    updateClassNote: (noteId: string, updates: Partial<ClassNote>) => {
      actions.updateClassNote(noteId, updates).catch(console.error)
    },
    
    deleteClassNote: (noteId: string) => {
      actions.deleteClassNote(noteId).catch(console.error)
    },
    
    addTest: (testData: Omit<Test, 'id' | 'createdDate' | 'updatedDate'>) => {
      actions.addTest(testData).catch(console.error)
      // Return a temporary test for immediate UI updates
      return {
        id: `temp-${Date.now()}`,
        ...testData,
        createdDate: new Date().toISOString().split('T')[0],
        updatedDate: new Date().toISOString().split('T')[0]
      } as Test
    },
    
    updateTest: (testId: string, updates: Partial<Test>) => {
      actions.updateTest(testId, updates).catch(console.error)
    },
    
    deleteTest: (testId: string) => {
      actions.deleteTest(testId).catch(console.error)
    },
    
    addTestResult: (resultData: Omit<TestResult, 'id' | 'createdDate' | 'updatedDate'>) => {
      actions.addTestResult(resultData).catch(console.error)
      // Return a temporary result for immediate UI updates
      return {
        id: `temp-${Date.now()}`,
        ...resultData,
        createdDate: new Date().toISOString().split('T')[0],
        updatedDate: new Date().toISOString().split('T')[0]
      } as TestResult
    },
    
    updateTestResult: (resultId: string, updates: Partial<TestResult>) => {
      actions.updateTestResult(resultId, updates).catch(console.error)
    },
    
    deleteTestResult: (resultId: string) => {
      actions.deleteTestResult(resultId).catch(console.error)
    },
    
    addHomeworkAssignment: (assignmentData: Omit<HomeworkAssignment, 'id' | 'createdDate' | 'updatedDate'>) => {
      actions.addHomeworkAssignment(assignmentData).catch(console.error)
      // Return a temporary assignment for immediate UI updates
      return {
        id: `temp-${Date.now()}`,
        ...assignmentData,
        createdDate: new Date().toISOString().split('T')[0],
        updatedDate: new Date().toISOString().split('T')[0]
      } as HomeworkAssignment
    },
    
    updateHomeworkAssignment: (assignmentId: string, updates: Partial<HomeworkAssignment>) => {
      actions.updateHomeworkAssignment(assignmentId, updates).catch(console.error)
    },
    
    deleteHomeworkAssignment: (assignmentId: string) => {
      actions.deleteHomeworkAssignment(assignmentId).catch(console.error)
    },
    
    addHomeworkSubmission: (submissionData: Omit<HomeworkSubmission, 'id' | 'createdDate' | 'updatedDate'>) => {
      actions.addHomeworkSubmission(submissionData).catch(console.error)
      // Return a temporary submission for immediate UI updates
      return {
        id: `temp-${Date.now()}`,
        ...submissionData,
        createdDate: new Date().toISOString().split('T')[0],
        updatedDate: new Date().toISOString().split('T')[0]
      } as HomeworkSubmission
    },
    
    updateHomeworkSubmission: (submissionId: string, updates: Partial<HomeworkSubmission>) => {
      actions.updateHomeworkSubmission(submissionId, updates).catch(console.error)
    },
    
    deleteHomeworkSubmission: (submissionId: string) => {
      actions.deleteHomeworkSubmission(submissionId).catch(console.error)
    }
  }

  return {
    data,
    actions: compatibilityActions,
    // Expose additional API-specific features
    apiActions: actions,
    loading,
    errors,
    isInitialLoading
  }
}