import { createContext, useContext, ReactNode } from 'react'
import { useEnhancedAppData, EnhancedAppDataProvider } from './EnhancedAppDataContext'
import { useAppDataService } from '@/hooks/useAppDataService'
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

interface AppDataMigrationContextType {
  data: AppData
  actions: AppActions
  loading: LoadingStates
  errors: ErrorStates
  isInitialLoading: boolean
  isUsingApiService: boolean
}

const AppDataMigrationContext = createContext<AppDataMigrationContextType | undefined>(undefined)

export function useAppData() {
  const context = useContext(AppDataMigrationContext)
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataMigrationProvider')
  }
  return context
}

interface AppDataMigrationProviderProps {
  children: ReactNode
}

export function AppDataMigrationProvider({ children }: AppDataMigrationProviderProps) {
  return (
    <EnhancedAppDataProvider>
      <AppDataMigrationProviderInner>
        {children}
      </AppDataMigrationProviderInner>
    </EnhancedAppDataProvider>
  )
}

function AppDataMigrationProviderInner({ children }: AppDataMigrationProviderProps) {

  // Use the API service for production
  const apiServiceData = useAppDataService()
  
  // Use the API service now that the backend is ready
  const contextValue: AppDataMigrationContextType = {
    ...apiServiceData,
    isUsingApiService: true
  }

  return (
    <AppDataMigrationContext.Provider value={contextValue}>
      {children}
    </AppDataMigrationContext.Provider>
  )
}

// Export individual implementations for testing and specific use cases
export { useEnhancedAppData as useAppDataLegacy } from './EnhancedAppDataContext'
export { useAppDataService } from '@/hooks/useAppDataService'
export { useAppDataWithToasts } from '@/hooks/useAppDataWithToasts'