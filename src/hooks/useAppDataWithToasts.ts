import { useCallback } from 'react'
import { useAppData } from '@/context/AppDataServiceContext'
import { ApiError, NetworkError } from '@/services/AppDataService'
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

export function useAppDataWithToasts() {
  const appData = useAppData()

  // Helper function to handle errors with toast notifications
  const handleError = useCallback((operation: string, error: unknown) => {
    let message = 'An unexpected error occurred'

    if (error instanceof ApiError) {
      message = error.message
      console.log(operation, error.message)
    } else if (error instanceof NetworkError) {
      message = 'Network connection failed. Please check your internet connection.'
    } else if (error instanceof Error) {
      message = error.message
    }

    console.log(message)
  }, [])

  // Enhanced actions with toast notifications
  const enhancedActions = {
    addClass: useCallback(async (classData: Omit<Class, 'id' | 'createdDate' | 'enrolledStudents'>): Promise<Class> => {
      try {
        const result = await appData.actions.addClass(classData)
        console.log(`Class "${classData.name}" created successfully`)
        return result
      } catch (error) {
        handleError('create class', error)
        throw error
      }
    }, [appData.actions, handleError]),

    addStudent: useCallback(async (studentData: Omit<Student, 'id' | 'enrollmentDate'>): Promise<Student> => {
      try {
        const result = await appData.actions.addStudent(studentData)
        console.log(`Student "${studentData.name}" added successfully`)
        return result
      } catch (error) {
        handleError('add student', error)
        throw error
      }
    }, [appData.actions, handleError]),

    updateStudent: useCallback(async (studentId: string, updates: Partial<Student>): Promise<void> => {
      try {
        await appData.actions.updateStudent(studentId, updates)
        console.log('Student updated successfully')
      } catch (error) {
        handleError('update student', error)
        throw error
      }
    }, [appData.actions, handleError]),

    deleteStudent: useCallback(async (studentId: string): Promise<void> => {
      try {
        await appData.actions.deleteStudent(studentId)
        console.log('Student deleted successfully')
      } catch (error) {
        handleError('delete student', error)
        throw error
      }
    }, [appData.actions, handleError]),

    updateClass: useCallback(async (classId: string, updates: Partial<Class>): Promise<void> => {
      try {
        await appData.actions.updateClass(classId, updates)
        console.log('Class updated successfully')
      } catch (error) {
        handleError('update class', error)
        throw error
      }
    }, [appData.actions, handleError]),

    enrollStudent: useCallback(async (classId: string, studentId: string): Promise<void> => {
      try {
        await appData.actions.enrollStudent(classId, studentId)
        console.log('Student enrolled successfully')
      } catch (error) {
        handleError('enroll student', error)
        throw error
      }
    }, [appData.actions, handleError]),

    unenrollStudent: useCallback(async (classId: string, studentId: string): Promise<void> => {
      try {
        await appData.actions.unenrollStudent(classId, studentId)
        console.log('Student unenrolled successfully')
      } catch (error) {
        handleError('unenroll student', error)
        throw error
      }
    }, [appData.actions, handleError]),

    addSchedule: useCallback(async (scheduleData: Omit<Schedule, 'id'>): Promise<Schedule> => {
      try {
        const result = await appData.actions.addSchedule(scheduleData)
        console.log('Schedule created successfully')
        return result
      } catch (error) {
        handleError('create schedule', error)
        throw error
      }
    }, [appData.actions, handleError]),

    updateSchedule: useCallback(async (scheduleId: string, updates: Partial<Schedule>): Promise<void> => {
      try {
        await appData.actions.updateSchedule(scheduleId, updates)
        console.log('Schedule updated successfully')
      } catch (error) {
        handleError('update schedule', error)
        throw error
      }
    }, [appData.actions, handleError]),

    deleteSchedule: useCallback(async (scheduleId: string): Promise<void> => {
      try {
        await appData.actions.deleteSchedule(scheduleId)
        console.log('Schedule deleted successfully')
      } catch (error) {
        handleError('delete schedule', error)
        throw error
      }
    }, [appData.actions, handleError]),

    addScheduleException: useCallback(async (exceptionData: Omit<ScheduleException, 'id' | 'createdDate'>): Promise<ScheduleException> => {
      try {
        const result = await appData.actions.addScheduleException(exceptionData)
        console.log('Schedule exception created successfully')
        return result
      } catch (error) {
        handleError('create schedule exception', error)
        throw error
      }
    }, [appData.actions, handleError]),

    updateScheduleException: useCallback(async (exceptionId: string, updates: Partial<ScheduleException>): Promise<void> => {
      try {
        await appData.actions.updateScheduleException(exceptionId, updates)
        console.log('Schedule exception updated successfully')
      } catch (error) {
        handleError('update schedule exception', error)
        throw error
      }
    }, [appData.actions, handleError]),

    deleteScheduleException: useCallback(async (exceptionId: string): Promise<void> => {
      try {
        await appData.actions.deleteScheduleException(exceptionId)
        console.log('Schedule exception deleted successfully')
      } catch (error) {
        handleError('delete schedule exception', error)
        throw error
      }
    }, [appData.actions, handleError]),

    addMeeting: useCallback(async (meetingData: Omit<Meeting, 'id' | 'createdDate'>): Promise<Meeting> => {
      try {
        const result = await appData.actions.addMeeting(meetingData)
        console.log(`Meeting "${meetingData.title}" scheduled successfully`)
        return result
      } catch (error) {
        handleError('schedule meeting', error)
        throw error
      }
    }, [appData.actions, handleError]),

    updateMeeting: useCallback(async (meetingId: string, updates: Partial<Meeting>): Promise<void> => {
      try {
        await appData.actions.updateMeeting(meetingId, updates)
        console.log('Meeting updated successfully')
      } catch (error) {
        handleError('update meeting', error)
        throw error
      }
    }, [appData.actions, handleError]),

    deleteMeeting: useCallback(async (meetingId: string): Promise<void> => {
      try {
        await appData.actions.deleteMeeting(meetingId)
        console.log('Meeting deleted successfully')
      } catch (error) {
        handleError('delete meeting', error)
        throw error
      }
    }, [appData.actions, handleError]),

    addAttendanceRecord: useCallback(async (attendanceData: Omit<AttendanceRecord, 'id' | 'createdDate'>): Promise<AttendanceRecord> => {
      try {
        const result = await appData.actions.addAttendanceRecord(attendanceData)
        console.log('Attendance recorded successfully')
        return result
      } catch (error) {
        handleError('record attendance', error)
        throw error
      }
    }, [appData.actions, handleError]),

    updateAttendanceRecord: useCallback(async (attendanceId: string, updates: Partial<AttendanceRecord>): Promise<void> => {
      try {
        await appData.actions.updateAttendanceRecord(attendanceId, updates)
        console.log('Attendance updated successfully')
      } catch (error) {
        handleError('update attendance', error)
        throw error
      }
    }, [appData.actions, handleError]),

    addClassNote: useCallback(async (noteData: Omit<ClassNote, 'id' | 'createdDate' | 'updatedDate'>): Promise<ClassNote> => {
      try {
        const result = await appData.actions.addClassNote(noteData)
        console.log('Class note saved successfully')
        return result
      } catch (error) {
        handleError('save class note', error)
        throw error
      }
    }, [appData.actions, handleError]),

    updateClassNote: useCallback(async (noteId: string, updates: Partial<ClassNote>): Promise<void> => {
      try {
        await appData.actions.updateClassNote(noteId, updates)
        console.log('Class note updated successfully')
      } catch (error) {
        handleError('update class note', error)
        throw error
      }
    }, [appData.actions, handleError]),

    deleteClassNote: useCallback(async (noteId: string): Promise<void> => {
      try {
        await appData.actions.deleteClassNote(noteId)
        console.log('Class note deleted successfully')
      } catch (error) {
        handleError('delete class note', error)
        throw error
      }
    }, [appData.actions, handleError]),

    addTest: useCallback(async (testData: Omit<Test, 'id' | 'createdDate' | 'updatedDate'>): Promise<Test> => {
      try {
        const result = await appData.actions.addTest(testData)
        console.log(`Test "${testData.title}" created successfully`)
        return result
      } catch (error) {
        handleError('create test', error)
        throw error
      }
    }, [appData.actions, handleError]),

    updateTest: useCallback(async (testId: string, updates: Partial<Test>): Promise<void> => {
      try {
        await appData.actions.updateTest(testId, updates)
        console.log('Test updated successfully')
      } catch (error) {
        handleError('update test', error)
        throw error
      }
    }, [appData.actions, handleError]),

    deleteTest: useCallback(async (testId: string): Promise<void> => {
      try {
        await appData.actions.deleteTest(testId)
        console.log('Test deleted successfully')
      } catch (error) {
        handleError('delete test', error)
        throw error
      }
    }, [appData.actions, handleError]),

    addTestResult: useCallback(async (resultData: Omit<TestResult, 'id' | 'createdDate' | 'updatedDate'>): Promise<TestResult> => {
      try {
        const result = await appData.actions.addTestResult(resultData)
        console.log('Test result saved successfully')
        return result
      } catch (error) {
        handleError('save test result', error)
        throw error
      }
    }, [appData.actions, handleError]),

    updateTestResult: useCallback(async (resultId: string, updates: Partial<TestResult>): Promise<void> => {
      try {
        await appData.actions.updateTestResult(resultId, updates)
        console.log('Test result updated successfully')
      } catch (error) {
        handleError('update test result', error)
        throw error
      }
    }, [appData.actions, handleError]),

    deleteTestResult: useCallback(async (resultId: string): Promise<void> => {
      try {
        await appData.actions.deleteTestResult(resultId)
        console.log('Test result deleted successfully')
      } catch (error) {
        handleError('delete test result', error)
        throw error
      }
    }, [appData.actions, handleError]),

    addHomeworkAssignment: useCallback(async (assignmentData: Omit<HomeworkAssignment, 'id' | 'createdDate' | 'updatedDate'>): Promise<HomeworkAssignment> => {
      try {
        const result = await appData.actions.addHomeworkAssignment(assignmentData)
        console.log(`Assignment "${assignmentData.title}" created successfully`)
        return result
      } catch (error) {
        handleError('create assignment', error)
        throw error
      }
    }, [appData.actions, handleError]),

    updateHomeworkAssignment: useCallback(async (assignmentId: string, updates: Partial<HomeworkAssignment>): Promise<void> => {
      try {
        await appData.actions.updateHomeworkAssignment(assignmentId, updates)
        console.log('Assignment updated successfully')
      } catch (error) {
        handleError('update assignment', error)
        throw error
      }
    }, [appData.actions, handleError]),

    deleteHomeworkAssignment: useCallback(async (assignmentId: string): Promise<void> => {
      try {
        await appData.actions.deleteHomeworkAssignment(assignmentId)
        console.log('Assignment deleted successfully')
      } catch (error) {
        handleError('delete assignment', error)
        throw error
      }
    }, [appData.actions, handleError]),

    addHomeworkSubmission: useCallback(async (submissionData: Omit<HomeworkSubmission, 'id' | 'createdDate' | 'updatedDate'>): Promise<HomeworkSubmission> => {
      try {
        const result = await appData.actions.addHomeworkSubmission(submissionData)
        console.log('Homework submitted successfully')
        return result
      } catch (error) {
        handleError('submit homework', error)
        throw error
      }
    }, [appData.actions, handleError]),

    updateHomeworkSubmission: useCallback(async (submissionId: string, updates: Partial<HomeworkSubmission>): Promise<void> => {
      try {
        await appData.actions.updateHomeworkSubmission(submissionId, updates)
        console.log('Homework submission updated successfully')
      } catch (error) {
        handleError('update homework submission', error)
        throw error
      }
    }, [appData.actions, handleError]),

    deleteHomeworkSubmission: useCallback(async (submissionId: string): Promise<void> => {
      try {
        await appData.actions.deleteHomeworkSubmission(submissionId)
        console.log('Homework submission deleted successfully')
      } catch (error) {
        handleError('delete homework submission', error)
        throw error
      }
    }, [appData.actions, handleError]),

    // Utility actions
    refreshData: useCallback(async (): Promise<void> => {
      try {
        await appData.actions.refreshData()
        console.log('Data refreshed successfully')
      } catch (error) {
        handleError('refresh data', error)
        throw error
      }
    }, [appData.actions, handleError]),

    clearCache: useCallback((): void => {
      appData.actions.clearCache()
      console.log('Cache cleared successfully')
    }, [appData.actions])
  }

  return {
    ...appData,
    actions: enhancedActions
  }
}