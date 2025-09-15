import { appDataService } from '@/services/AppDataService'

// Types for impact calculation
export interface ImpactItem {
  type: string
  count: number
  description: string
}

export interface DeletionImpact {
  affectedItems: ImpactItem[]
  hasAssociatedData: boolean
  warningMessage?: string
}

/**
 * Calculate the impact of deleting a class by counting all related records
 * @param classId - The ID of the class to be deleted
 * @returns Promise<DeletionImpact> - Impact information including affected items
 */
export async function calculateClassDeletionImpact(classId: string): Promise<DeletionImpact> {
  try {
    const affectedItems: ImpactItem[] = []
    let totalAffectedRecords = 0

    // Get the class to check enrolled students
    const classData = await appDataService.getClass(classId)
    const enrolledStudentsCount = classData.enrolledStudents?.length || 0
    
    if (enrolledStudentsCount > 0) {
      affectedItems.push({
        type: 'students',
        count: enrolledStudentsCount,
        description: `${enrolledStudentsCount} enrolled student${enrolledStudentsCount === 1 ? '' : 's'} will be unenrolled`
      })
      totalAffectedRecords += enrolledStudentsCount
    }

    // Count schedules for this class
    const schedules = await appDataService.getSchedulesByClass(classId)
    if (schedules.length > 0) {
      affectedItems.push({
        type: 'schedules',
        count: schedules.length,
        description: `${schedules.length} schedule${schedules.length === 1 ? '' : 's'} will be deleted`
      })
      totalAffectedRecords += schedules.length
    }

    // Count class notes
    const classNotes = await appDataService.getClassNotesByClass(classId)
    if (classNotes.length > 0) {
      affectedItems.push({
        type: 'notes',
        count: classNotes.length,
        description: `${classNotes.length} class note${classNotes.length === 1 ? '' : 's'} will be deleted`
      })
      totalAffectedRecords += classNotes.length
    }

    // Count attendance records
    const attendanceRecords = await appDataService.getAttendanceByClass(classId)
    if (attendanceRecords.length > 0) {
      affectedItems.push({
        type: 'attendance',
        count: attendanceRecords.length,
        description: `${attendanceRecords.length} attendance record${attendanceRecords.length === 1 ? '' : 's'} will be deleted`
      })
      totalAffectedRecords += attendanceRecords.length
    }

    // Count tests/assessments
    const tests = await appDataService.getTestsByClass(classId)
    if (tests.length > 0) {
      // Also count test results for these tests
      let totalTestResults = 0
      for (const test of tests) {
        const testResults = await appDataService.getTestResultsByTest(test.id)
        totalTestResults += testResults.length
      }

      affectedItems.push({
        type: 'tests',
        count: tests.length,
        description: `${tests.length} test${tests.length === 1 ? '' : 's'} will be deleted`
      })
      totalAffectedRecords += tests.length

      if (totalTestResults > 0) {
        affectedItems.push({
          type: 'test-results',
          count: totalTestResults,
          description: `${totalTestResults} test result${totalTestResults === 1 ? '' : 's'} will be deleted`
        })
        totalAffectedRecords += totalTestResults
      }
    }

    // Count homework assignments
    const homeworkAssignments = await appDataService.getHomeworkAssignmentsByClass(classId)
    if (homeworkAssignments.length > 0) {
      // Also count homework submissions for these assignments
      let totalSubmissions = 0
      for (const assignment of homeworkAssignments) {
        const submissions = await appDataService.getHomeworkSubmissionsByAssignment(assignment.id)
        totalSubmissions += submissions.length
      }

      affectedItems.push({
        type: 'homework',
        count: homeworkAssignments.length,
        description: `${homeworkAssignments.length} homework assignment${homeworkAssignments.length === 1 ? '' : 's'} will be deleted`
      })
      totalAffectedRecords += homeworkAssignments.length

      if (totalSubmissions > 0) {
        affectedItems.push({
          type: 'homework-submissions',
          count: totalSubmissions,
          description: `${totalSubmissions} homework submission${totalSubmissions === 1 ? '' : 's'} will be deleted`
        })
        totalAffectedRecords += totalSubmissions
      }
    }

    // Check for meetings related to this class (by checking if class students are participants)
    const allMeetings = await appDataService.getMeetings()
    const relatedMeetings = allMeetings.filter(meeting => 
      meeting.participantType === 'students' && 
      meeting.participants.some(participantId => classData.enrolledStudents?.includes(participantId))
    )
    
    if (relatedMeetings.length > 0) {
      affectedItems.push({
        type: 'meetings',
        count: relatedMeetings.length,
        description: `${relatedMeetings.length} meeting${relatedMeetings.length === 1 ? '' : 's'} may be affected`
      })
      totalAffectedRecords += relatedMeetings.length
    }

    const hasAssociatedData = totalAffectedRecords > 0
    let warningMessage: string | undefined

    if (hasAssociatedData) {
      if (totalAffectedRecords > 10) {
        warningMessage = `This class has extensive data (${totalAffectedRecords} related records). This action cannot be undone.`
      } else {
        warningMessage = `This action will permanently delete all related data and cannot be undone.`
      }
    }

    return {
      affectedItems,
      hasAssociatedData,
      warningMessage
    }

  } catch (error) {
    console.error('Error calculating class deletion impact:', error)
    throw new Error('Failed to calculate deletion impact. Please try again.')
  }
}

/**
 * Calculate the impact of deleting a student by counting all related records
 * @param studentId - The ID of the student to be deleted
 * @returns Promise<DeletionImpact> - Impact information including affected items
 */
export async function calculateStudentDeletionImpact(studentId: string): Promise<DeletionImpact> {
  try {
    const affectedItems: ImpactItem[] = []
    let totalAffectedRecords = 0

    // Count enrolled classes
    const allClasses = await appDataService.getClasses()
    const enrolledClasses = allClasses.filter(classItem => 
      classItem.enrolledStudents?.includes(studentId)
    )
    
    if (enrolledClasses.length > 0) {
      affectedItems.push({
        type: 'classes',
        count: enrolledClasses.length,
        description: `Student will be unenrolled from ${enrolledClasses.length} class${enrolledClasses.length === 1 ? '' : 'es'}`
      })
      totalAffectedRecords += enrolledClasses.length
    }

    // Count attendance records
    const allAttendanceRecords = await appDataService.getAttendanceRecords()
    const studentAttendanceRecords = allAttendanceRecords.filter(record =>
      record.attendanceData.some(attendance => attendance.studentId === studentId)
    )
    
    if (studentAttendanceRecords.length > 0) {
      affectedItems.push({
        type: 'attendance',
        count: studentAttendanceRecords.length,
        description: `${studentAttendanceRecords.length} attendance record${studentAttendanceRecords.length === 1 ? '' : 's'} will be deleted`
      })
      totalAffectedRecords += studentAttendanceRecords.length
    }

    // Count test results
    const allTestResults = await appDataService.getTestResults()
    const studentTestResults = allTestResults.filter(result => result.studentId === studentId)
    
    if (studentTestResults.length > 0) {
      affectedItems.push({
        type: 'test-results',
        count: studentTestResults.length,
        description: `${studentTestResults.length} test result${studentTestResults.length === 1 ? '' : 's'} will be deleted`
      })
      totalAffectedRecords += studentTestResults.length
    }

    // Count homework submissions
    const allHomeworkSubmissions = await appDataService.getHomeworkSubmissions()
    const studentSubmissions = allHomeworkSubmissions.filter(submission => submission.studentId === studentId)
    
    if (studentSubmissions.length > 0) {
      affectedItems.push({
        type: 'homework-submissions',
        count: studentSubmissions.length,
        description: `${studentSubmissions.length} homework submission${studentSubmissions.length === 1 ? '' : 's'} will be deleted`
      })
      totalAffectedRecords += studentSubmissions.length
    }

    // Count meetings where this student is a participant
    const allMeetings = await appDataService.getMeetings()
    const studentMeetings = allMeetings.filter(meeting => 
      meeting.participantType === 'students' && meeting.participants.includes(studentId)
    )
    
    if (studentMeetings.length > 0) {
      affectedItems.push({
        type: 'meetings',
        count: studentMeetings.length,
        description: `${studentMeetings.length} meeting${studentMeetings.length === 1 ? '' : 's'} will be affected`
      })
      totalAffectedRecords += studentMeetings.length
    }

    const hasAssociatedData = totalAffectedRecords > 0
    let warningMessage: string | undefined

    if (hasAssociatedData) {
      if (totalAffectedRecords > 10) {
        warningMessage = `This student has extensive data (${totalAffectedRecords} related records). This action cannot be undone.`
      } else {
        warningMessage = `This action will permanently delete all related data and cannot be undone.`
      }
    }

    return {
      affectedItems,
      hasAssociatedData,
      warningMessage
    }

  } catch (error) {
    console.error('Error calculating student deletion impact:', error)
    throw new Error('Failed to calculate deletion impact. Please try again.')
  }
}

/**
 * Format impact information for display in confirmation dialogs
 * @param impact - The deletion impact data
 * @returns Formatted string for display
 */
export function formatImpactInformation(impact: DeletionImpact): string {
  if (!impact.hasAssociatedData) {
    return 'No related data will be affected by this deletion.'
  }

  const impactLines = impact.affectedItems.map(item => `• ${item.description}`)
  return impactLines.join('\n')
}

/**
 * Get a summary count of all affected items
 * @param impact - The deletion impact data
 * @returns Total count of affected records
 */
export function getTotalAffectedCount(impact: DeletionImpact): number {
  return impact.affectedItems.reduce((total, item) => total + item.count, 0)
}

/**
 * Check if deletion should show a high-impact warning
 * @param impact - The deletion impact data
 * @returns True if this is considered a high-impact deletion
 */
export function isHighImpactDeletion(impact: DeletionImpact): boolean {
  const totalCount = getTotalAffectedCount(impact)
  return totalCount > 10
}

/**
 * Get impact items grouped by category for better display
 * @param impact - The deletion impact data
 * @returns Grouped impact items
 */
export function getGroupedImpactItems(impact: DeletionImpact): { [category: string]: ImpactItem[] } {
  const groups: { [category: string]: ImpactItem[] } = {
    'Academic Records': [],
    'Administrative': [],
    'Other': []
  }

  impact.affectedItems.forEach(item => {
    switch (item.type) {
      case 'tests':
      case 'test-results':
      case 'homework':
      case 'homework-submissions':
      case 'notes':
        groups['Academic Records'].push(item)
        break
      case 'students':
      case 'classes':
      case 'attendance':
      case 'schedules':
        groups['Administrative'].push(item)
        break
      default:
        groups['Other'].push(item)
        break
    }
  })

  // Remove empty groups
  Object.keys(groups).forEach(key => {
    if (groups[key].length === 0) {
      delete groups[key]
    }
  })

  return groups
}