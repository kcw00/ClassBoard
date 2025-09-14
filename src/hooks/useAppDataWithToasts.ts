import { useCallback } from 'react'
import { useAppDataService } from './useAppDataService'
import { useSuccessToast, useErrorToast } from '@/components/common/Toast'
import { ApiError, NetworkError } from '@/services/AppDataService'
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

export function useAppDataWithToasts() {
  const appData = useAppDataService()
  const showSuccess = useSuccessToast()
  const showError = useErrorToast()

  // Helper function to handle errors with toast notifications
  const handleError = useCallback((operation: string, error: unknown) => {
    let message = 'An unexpected error occurred'
    
    if (error instanceof ApiError) {
      message = error.message
    } else if (error instanceof NetworkError) {
      message = 'Network connection failed. Please check your internet connection.'
    } else if (error instanceof Error) {
      message = error.message
    }

    showError(message, `Failed to ${operation}`, {
      label: 'Retry',
      onClick: () => {
        // Could implement retry logic here
        console.log('Retry clicked for:', operation)
      }
    })
  }, [showError])

  // Enhanced actions with toast notifications
  const enhancedActions = {
    addClass: useCallback(async (classData: Omit<Class, 'id' | 'createdDate' | 'enrolledStudents'>): Promise<Class> => {
      try {
        const result = await appData.actions.addClass(classData)
        showSuccess(`Class "${classData.name}" created successfully`)
        return result
      } catch (error) {
        handleError('create class', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    addStudent: useCallback(async (studentData: Omit<Student, 'id' | 'enrollmentDate'>): Promise<Student> => {
      try {
        const result = await appData.actions.addStudent(studentData)
        showSuccess(`Student "${studentData.name}" added successfully`)
        return result
      } catch (error) {
        handleError('add student', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    updateStudent: useCallback(async (studentId: string, updates: Partial<Student>): Promise<void> => {
      try {
        await appData.actions.updateStudent(studentId, updates)
        showSuccess('Student updated successfully')
      } catch (error) {
        handleError('update student', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    deleteStudent: useCallback(async (studentId: string): Promise<void> => {
      try {
        await appData.actions.deleteStudent(studentId)
        showSuccess('Student deleted successfully')
      } catch (error) {
        handleError('delete student', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    updateClass: useCallback(async (classId: string, updates: Partial<Class>): Promise<void> => {
      try {
        await appData.actions.updateClass(classId, updates)
        showSuccess('Class updated successfully')
      } catch (error) {
        handleError('update class', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    enrollStudent: useCallback(async (classId: string, studentId: string): Promise<void> => {
      try {
        await appData.actions.enrollStudent(classId, studentId)
        showSuccess('Student enrolled successfully')
      } catch (error) {
        handleError('enroll student', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    unenrollStudent: useCallback(async (classId: string, studentId: string): Promise<void> => {
      try {
        await appData.actions.unenrollStudent(classId, studentId)
        showSuccess('Student unenrolled successfully')
      } catch (error) {
        handleError('unenroll student', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    addSchedule: useCallback(async (scheduleData: Omit<Schedule, 'id'>): Promise<Schedule> => {
      try {
        const result = await appData.actions.addSchedule(scheduleData)
        showSuccess('Schedule created successfully')
        return result
      } catch (error) {
        handleError('create schedule', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    updateSchedule: useCallback(async (scheduleId: string, updates: Partial<Schedule>): Promise<void> => {
      try {
        await appData.actions.updateSchedule(scheduleId, updates)
        showSuccess('Schedule updated successfully')
      } catch (error) {
        handleError('update schedule', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    deleteSchedule: useCallback(async (scheduleId: string): Promise<void> => {
      try {
        await appData.actions.deleteSchedule(scheduleId)
        showSuccess('Schedule deleted successfully')
      } catch (error) {
        handleError('delete schedule', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    addScheduleException: useCallback(async (exceptionData: Omit<ScheduleException, 'id' | 'createdDate'>): Promise<ScheduleException> => {
      try {
        const result = await appData.actions.addScheduleException(exceptionData)
        showSuccess('Schedule exception created successfully')
        return result
      } catch (error) {
        handleError('create schedule exception', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    updateScheduleException: useCallback(async (exceptionId: string, updates: Partial<ScheduleException>): Promise<void> => {
      try {
        await appData.actions.updateScheduleException(exceptionId, updates)
        showSuccess('Schedule exception updated successfully')
      } catch (error) {
        handleError('update schedule exception', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    deleteScheduleException: useCallback(async (exceptionId: string): Promise<void> => {
      try {
        await appData.actions.deleteScheduleException(exceptionId)
        showSuccess('Schedule exception deleted successfully')
      } catch (error) {
        handleError('delete schedule exception', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    addMeeting: useCallback(async (meetingData: Omit<Meeting, 'id' | 'createdDate'>): Promise<Meeting> => {
      try {
        const result = await appData.actions.addMeeting(meetingData)
        showSuccess(`Meeting "${meetingData.title}" scheduled successfully`)
        return result
      } catch (error) {
        handleError('schedule meeting', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    updateMeeting: useCallback(async (meetingId: string, updates: Partial<Meeting>): Promise<void> => {
      try {
        await appData.actions.updateMeeting(meetingId, updates)
        showSuccess('Meeting updated successfully')
      } catch (error) {
        handleError('update meeting', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    deleteMeeting: useCallback(async (meetingId: string): Promise<void> => {
      try {
        await appData.actions.deleteMeeting(meetingId)
        showSuccess('Meeting deleted successfully')
      } catch (error) {
        handleError('delete meeting', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    addAttendanceRecord: useCallback(async (attendanceData: Omit<AttendanceRecord, 'id' | 'createdDate'>): Promise<AttendanceRecord> => {
      try {
        const result = await appData.actions.addAttendanceRecord(attendanceData)
        showSuccess('Attendance recorded successfully')
        return result
      } catch (error) {
        handleError('record attendance', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    updateAttendanceRecord: useCallback(async (attendanceId: string, updates: Partial<AttendanceRecord>): Promise<void> => {
      try {
        await appData.actions.updateAttendanceRecord(attendanceId, updates)
        showSuccess('Attendance updated successfully')
      } catch (error) {
        handleError('update attendance', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    addClassNote: useCallback(async (noteData: Omit<ClassNote, 'id' | 'createdDate' | 'updatedDate'>): Promise<ClassNote> => {
      try {
        const result = await appData.actions.addClassNote(noteData)
        showSuccess('Class note saved successfully')
        return result
      } catch (error) {
        handleError('save class note', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    updateClassNote: useCallback(async (noteId: string, updates: Partial<ClassNote>): Promise<void> => {
      try {
        await appData.actions.updateClassNote(noteId, updates)
        showSuccess('Class note updated successfully')
      } catch (error) {
        handleError('update class note', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    deleteClassNote: useCallback(async (noteId: string): Promise<void> => {
      try {
        await appData.actions.deleteClassNote(noteId)
        showSuccess('Class note deleted successfully')
      } catch (error) {
        handleError('delete class note', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    addTest: useCallback(async (testData: Omit<Test, 'id' | 'createdDate' | 'updatedDate'>): Promise<Test> => {
      try {
        const result = await appData.actions.addTest(testData)
        showSuccess(`Test "${testData.title}" created successfully`)
        return result
      } catch (error) {
        handleError('create test', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    updateTest: useCallback(async (testId: string, updates: Partial<Test>): Promise<void> => {
      try {
        await appData.actions.updateTest(testId, updates)
        showSuccess('Test updated successfully')
      } catch (error) {
        handleError('update test', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    deleteTest: useCallback(async (testId: string): Promise<void> => {
      try {
        await appData.actions.deleteTest(testId)
        showSuccess('Test deleted successfully')
      } catch (error) {
        handleError('delete test', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    addTestResult: useCallback(async (resultData: Omit<TestResult, 'id' | 'createdDate' | 'updatedDate'>): Promise<TestResult> => {
      try {
        const result = await appData.actions.addTestResult(resultData)
        showSuccess('Test result saved successfully')
        return result
      } catch (error) {
        handleError('save test result', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    updateTestResult: useCallback(async (resultId: string, updates: Partial<TestResult>): Promise<void> => {
      try {
        await appData.actions.updateTestResult(resultId, updates)
        showSuccess('Test result updated successfully')
      } catch (error) {
        handleError('update test result', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    deleteTestResult: useCallback(async (resultId: string): Promise<void> => {
      try {
        await appData.actions.deleteTestResult(resultId)
        showSuccess('Test result deleted successfully')
      } catch (error) {
        handleError('delete test result', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    addHomeworkAssignment: useCallback(async (assignmentData: Omit<HomeworkAssignment, 'id' | 'createdDate' | 'updatedDate'>): Promise<HomeworkAssignment> => {
      try {
        const result = await appData.actions.addHomeworkAssignment(assignmentData)
        showSuccess(`Assignment "${assignmentData.title}" created successfully`)
        return result
      } catch (error) {
        handleError('create assignment', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    updateHomeworkAssignment: useCallback(async (assignmentId: string, updates: Partial<HomeworkAssignment>): Promise<void> => {
      try {
        await appData.actions.updateHomeworkAssignment(assignmentId, updates)
        showSuccess('Assignment updated successfully')
      } catch (error) {
        handleError('update assignment', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    deleteHomeworkAssignment: useCallback(async (assignmentId: string): Promise<void> => {
      try {
        await appData.actions.deleteHomeworkAssignment(assignmentId)
        showSuccess('Assignment deleted successfully')
      } catch (error) {
        handleError('delete assignment', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    addHomeworkSubmission: useCallback(async (submissionData: Omit<HomeworkSubmission, 'id' | 'createdDate' | 'updatedDate'>): Promise<HomeworkSubmission> => {
      try {
        const result = await appData.actions.addHomeworkSubmission(submissionData)
        showSuccess('Homework submitted successfully')
        return result
      } catch (error) {
        handleError('submit homework', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    updateHomeworkSubmission: useCallback(async (submissionId: string, updates: Partial<HomeworkSubmission>): Promise<void> => {
      try {
        await appData.actions.updateHomeworkSubmission(submissionId, updates)
        showSuccess('Homework submission updated successfully')
      } catch (error) {
        handleError('update homework submission', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    deleteHomeworkSubmission: useCallback(async (submissionId: string): Promise<void> => {
      try {
        await appData.actions.deleteHomeworkSubmission(submissionId)
        showSuccess('Homework submission deleted successfully')
      } catch (error) {
        handleError('delete homework submission', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    // Utility actions
    refreshData: useCallback(async (): Promise<void> => {
      try {
        await appData.actions.refreshData()
        showSuccess('Data refreshed successfully')
      } catch (error) {
        handleError('refresh data', error)
        throw error
      }
    }, [appData.actions, showSuccess, handleError]),

    clearCache: useCallback((): void => {
      appData.actions.clearCache()
      showSuccess('Cache cleared successfully')
    }, [appData.actions, showSuccess])
  }

  return {
    ...appData,
    actions: enhancedActions
  }
}