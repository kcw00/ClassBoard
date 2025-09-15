import {
  calculateClassDeletionImpact,
  calculateStudentDeletionImpact,
  formatImpactInformation,
  getTotalAffectedCount,
  isHighImpactDeletion,
  getGroupedImpactItems
} from '../impactCalculation'

// Mock the AppDataService
jest.mock('@/services/AppDataService', () => ({
  appDataService: {
    getClass: jest.fn(),
    getSchedulesByClass: jest.fn(),
    getClassNotesByClass: jest.fn(),
    getAttendanceByClass: jest.fn(),
    getTestsByClass: jest.fn(),
    getTestResultsByTest: jest.fn(),
    getHomeworkAssignmentsByClass: jest.fn(),
    getHomeworkSubmissionsByAssignment: jest.fn(),
    getMeetings: jest.fn(),
    getClasses: jest.fn(),
    getAttendanceRecords: jest.fn(),
    getTestResults: jest.fn(),
    getHomeworkSubmissions: jest.fn()
  }
}))

import { appDataService } from '@/services/AppDataService'
const mockAppDataService = appDataService as jest.Mocked<typeof appDataService>

describe('Impact Calculation Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('calculateClassDeletionImpact', () => {
    it('should calculate impact for class with no associated data', async () => {
      // Mock empty responses
      mockAppDataService.getClass.mockResolvedValue({
        id: 'class-1',
        name: 'Empty Class',
        enrolledStudents: []
      })
      mockAppDataService.getSchedulesByClass.mockResolvedValue([])
      mockAppDataService.getClassNotesByClass.mockResolvedValue([])
      mockAppDataService.getAttendanceByClass.mockResolvedValue([])
      mockAppDataService.getTestsByClass.mockResolvedValue([])
      mockAppDataService.getHomeworkAssignmentsByClass.mockResolvedValue([])
      mockAppDataService.getMeetings.mockResolvedValue([])

      const impact = await calculateClassDeletionImpact('class-1')

      expect(impact.hasAssociatedData).toBe(false)
      expect(impact.affectedItems).toHaveLength(0)
      expect(impact.warningMessage).toBeUndefined()
    })

    it('should calculate impact for class with enrolled students only', async () => {
      mockAppDataService.getClass.mockResolvedValue({
        id: 'class-1',
        name: 'Biology Class',
        enrolledStudents: ['student-1', 'student-2', 'student-3']
      })
      mockAppDataService.getSchedulesByClass.mockResolvedValue([])
      mockAppDataService.getClassNotesByClass.mockResolvedValue([])
      mockAppDataService.getAttendanceByClass.mockResolvedValue([])
      mockAppDataService.getTestsByClass.mockResolvedValue([])
      mockAppDataService.getHomeworkAssignmentsByClass.mockResolvedValue([])
      mockAppDataService.getMeetings.mockResolvedValue([])

      const impact = await calculateClassDeletionImpact('class-1')

      expect(impact.hasAssociatedData).toBe(true)
      expect(impact.affectedItems).toHaveLength(1)
      expect(impact.affectedItems[0]).toEqual({
        type: 'students',
        count: 3,
        description: '3 enrolled students will be unenrolled'
      })
      expect(impact.warningMessage).toContain('permanently delete all related data')
    })

    it('should calculate impact for class with extensive data', async () => {
      mockAppDataService.getClass.mockResolvedValue({
        id: 'class-1',
        name: 'Advanced Biology',
        enrolledStudents: ['student-1', 'student-2']
      })
      mockAppDataService.getSchedulesByClass.mockResolvedValue([
        { id: 'schedule-1' },
        { id: 'schedule-2' }
      ])
      mockAppDataService.getClassNotesByClass.mockResolvedValue([
        { id: 'note-1' },
        { id: 'note-2' },
        { id: 'note-3' }
      ])
      mockAppDataService.getAttendanceByClass.mockResolvedValue([
        { id: 'attendance-1' },
        { id: 'attendance-2' },
        { id: 'attendance-3' },
        { id: 'attendance-4' },
        { id: 'attendance-5' }
      ])
      mockAppDataService.getTestsByClass.mockResolvedValue([
        { id: 'test-1' },
        { id: 'test-2' }
      ])
      mockAppDataService.getTestResultsByTest.mockImplementation((testId) => {
        if (testId === 'test-1') return Promise.resolve([{ id: 'result-1' }, { id: 'result-2' }])
        if (testId === 'test-2') return Promise.resolve([{ id: 'result-3' }])
        return Promise.resolve([])
      })
      mockAppDataService.getHomeworkAssignmentsByClass.mockResolvedValue([
        { id: 'hw-1' }
      ])
      mockAppDataService.getHomeworkSubmissionsByAssignment.mockResolvedValue([
        { id: 'submission-1' },
        { id: 'submission-2' }
      ])
      mockAppDataService.getMeetings.mockResolvedValue([])

      const impact = await calculateClassDeletionImpact('class-1')

      expect(impact.hasAssociatedData).toBe(true)
      expect(impact.affectedItems).toHaveLength(8) // Updated to match actual implementation
      
      // Check each impact item
      const itemTypes = impact.affectedItems.map(item => item.type)
      expect(itemTypes).toContain('students')
      expect(itemTypes).toContain('schedules')
      expect(itemTypes).toContain('notes')
      expect(itemTypes).toContain('attendance')
      expect(itemTypes).toContain('tests')
      expect(itemTypes).toContain('test-results')
      expect(itemTypes).toContain('homework')
      expect(itemTypes).toContain('homework-submissions')

      // Verify counts
      const studentsItem = impact.affectedItems.find(item => item.type === 'students')
      expect(studentsItem?.count).toBe(2)

      const testResultsItem = impact.affectedItems.find(item => item.type === 'test-results')
      expect(testResultsItem?.count).toBe(3) // 2 + 1 from both tests

      // Should have extensive data warning
      expect(impact.warningMessage).toContain('extensive data')
    })

    it('should handle API errors gracefully', async () => {
      mockAppDataService.getClass.mockRejectedValue(new Error('Network error'))

      await expect(calculateClassDeletionImpact('class-1')).rejects.toThrow(
        'Failed to calculate deletion impact. Please try again.'
      )
    })

    it('should handle singular vs plural descriptions correctly', async () => {
      mockAppDataService.getClass.mockResolvedValue({
        id: 'class-1',
        name: 'Single Student Class',
        enrolledStudents: ['student-1']
      })
      mockAppDataService.getSchedulesByClass.mockResolvedValue([{ id: 'schedule-1' }])
      mockAppDataService.getClassNotesByClass.mockResolvedValue([])
      mockAppDataService.getAttendanceByClass.mockResolvedValue([])
      mockAppDataService.getTestsByClass.mockResolvedValue([])
      mockAppDataService.getHomeworkAssignmentsByClass.mockResolvedValue([])
      mockAppDataService.getMeetings.mockResolvedValue([])

      const impact = await calculateClassDeletionImpact('class-1')

      expect(impact.affectedItems[0].description).toBe('1 enrolled student will be unenrolled')
      expect(impact.affectedItems[1].description).toBe('1 schedule will be deleted')
    })
  })

  describe('calculateStudentDeletionImpact', () => {
    it('should calculate impact for student with no associated data', async () => {
      mockAppDataService.getClasses.mockResolvedValue([])
      mockAppDataService.getAttendanceRecords.mockResolvedValue([])
      mockAppDataService.getTestResults.mockResolvedValue([])
      mockAppDataService.getHomeworkSubmissions.mockResolvedValue([])
      mockAppDataService.getMeetings.mockResolvedValue([])

      const impact = await calculateStudentDeletionImpact('student-1')

      expect(impact.hasAssociatedData).toBe(false)
      expect(impact.affectedItems).toHaveLength(0)
      expect(impact.warningMessage).toBeUndefined()
    })

    it('should calculate impact for student with enrolled classes', async () => {
      mockAppDataService.getClasses.mockResolvedValue([
        {
          id: 'class-1',
          name: 'Biology',
          enrolledStudents: ['student-1', 'student-2']
        },
        {
          id: 'class-2',
          name: 'Chemistry',
          enrolledStudents: ['student-1']
        },
        {
          id: 'class-3',
          name: 'Physics',
          enrolledStudents: ['student-2']
        }
      ])
      mockAppDataService.getAttendanceRecords.mockResolvedValue([])
      mockAppDataService.getTestResults.mockResolvedValue([])
      mockAppDataService.getHomeworkSubmissions.mockResolvedValue([])
      mockAppDataService.getMeetings.mockResolvedValue([])

      const impact = await calculateStudentDeletionImpact('student-1')

      expect(impact.hasAssociatedData).toBe(true)
      expect(impact.affectedItems).toHaveLength(1)
      expect(impact.affectedItems[0]).toEqual({
        type: 'classes',
        count: 2,
        description: 'Student will be unenrolled from 2 classes'
      })
    })

    it('should calculate impact for student with extensive data', async () => {
      mockAppDataService.getClasses.mockResolvedValue([
        {
          id: 'class-1',
          name: 'Biology',
          enrolledStudents: ['student-1']
        }
      ])
      mockAppDataService.getAttendanceRecords.mockResolvedValue([
        {
          id: 'attendance-1',
          attendanceData: [
            { studentId: 'student-1', status: 'present' },
            { studentId: 'student-2', status: 'absent' }
          ]
        },
        {
          id: 'attendance-2',
          attendanceData: [
            { studentId: 'student-1', status: 'present' }
          ]
        }
      ])
      mockAppDataService.getTestResults.mockResolvedValue([
        { id: 'result-1', studentId: 'student-1' },
        { id: 'result-2', studentId: 'student-1' },
        { id: 'result-3', studentId: 'student-2' }
      ])
      mockAppDataService.getHomeworkSubmissions.mockResolvedValue([
        { id: 'submission-1', studentId: 'student-1' },
        { id: 'submission-2', studentId: 'student-2' }
      ])
      mockAppDataService.getMeetings.mockResolvedValue([
        {
          id: 'meeting-1',
          participantType: 'students',
          participants: ['student-1', 'student-2']
        },
        {
          id: 'meeting-2',
          participantType: 'teachers',
          participants: ['teacher-1']
        }
      ])

      const impact = await calculateStudentDeletionImpact('student-1')

      expect(impact.hasAssociatedData).toBe(true)
      expect(impact.affectedItems).toHaveLength(5)

      // Verify each type is present
      const itemTypes = impact.affectedItems.map(item => item.type)
      expect(itemTypes).toContain('classes')
      expect(itemTypes).toContain('attendance')
      expect(itemTypes).toContain('test-results')
      expect(itemTypes).toContain('homework-submissions')
      expect(itemTypes).toContain('meetings')

      // Verify counts
      const attendanceItem = impact.affectedItems.find(item => item.type === 'attendance')
      expect(attendanceItem?.count).toBe(2)

      const testResultsItem = impact.affectedItems.find(item => item.type === 'test-results')
      expect(testResultsItem?.count).toBe(2)

      const submissionsItem = impact.affectedItems.find(item => item.type === 'homework-submissions')
      expect(submissionsItem?.count).toBe(1)

      const meetingsItem = impact.affectedItems.find(item => item.type === 'meetings')
      expect(meetingsItem?.count).toBe(1)
    })

    it('should handle API errors gracefully', async () => {
      mockAppDataService.getClasses.mockRejectedValue(new Error('Database error'))

      await expect(calculateStudentDeletionImpact('student-1')).rejects.toThrow(
        'Failed to calculate deletion impact. Please try again.'
      )
    })
  })

  describe('Utility Functions', () => {
    const mockImpact = {
      affectedItems: [
        { type: 'students', count: 5, description: '5 students will be affected' },
        { type: 'tests', count: 3, description: '3 tests will be deleted' },
        { type: 'notes', count: 10, description: '10 notes will be deleted' }
      ],
      hasAssociatedData: true,
      warningMessage: 'This action cannot be undone.'
    }

    describe('formatImpactInformation', () => {
      it('should format impact information correctly', () => {
        const formatted = formatImpactInformation(mockImpact)
        
        expect(formatted).toContain('• 5 students will be affected')
        expect(formatted).toContain('• 3 tests will be deleted')
        expect(formatted).toContain('• 10 notes will be deleted')
      })

      it('should handle no associated data', () => {
        const noDataImpact = {
          affectedItems: [],
          hasAssociatedData: false
        }

        const formatted = formatImpactInformation(noDataImpact)
        expect(formatted).toBe('No related data will be affected by this deletion.')
      })
    })

    describe('getTotalAffectedCount', () => {
      it('should calculate total affected count correctly', () => {
        const total = getTotalAffectedCount(mockImpact)
        expect(total).toBe(18) // 5 + 3 + 10
      })

      it('should handle empty impact', () => {
        const emptyImpact = {
          affectedItems: [],
          hasAssociatedData: false
        }

        const total = getTotalAffectedCount(emptyImpact)
        expect(total).toBe(0)
      })
    })

    describe('isHighImpactDeletion', () => {
      it('should identify high impact deletions', () => {
        const highImpact = {
          affectedItems: [
            { type: 'records', count: 15, description: '15 records' }
          ],
          hasAssociatedData: true
        }

        expect(isHighImpactDeletion(highImpact)).toBe(true)
      })

      it('should identify low impact deletions', () => {
        const lowImpact = {
          affectedItems: [
            { type: 'records', count: 5, description: '5 records' }
          ],
          hasAssociatedData: true
        }

        expect(isHighImpactDeletion(lowImpact)).toBe(false)
      })

      it('should handle edge case of exactly 10 items', () => {
        const edgeImpact = {
          affectedItems: [
            { type: 'records', count: 10, description: '10 records' }
          ],
          hasAssociatedData: true
        }

        expect(isHighImpactDeletion(edgeImpact)).toBe(false)
      })
    })

    describe('getGroupedImpactItems', () => {
      it('should group impact items by category', () => {
        const complexImpact = {
          affectedItems: [
            { type: 'students', count: 5, description: '5 students' },
            { type: 'tests', count: 3, description: '3 tests' },
            { type: 'test-results', count: 15, description: '15 test results' },
            { type: 'attendance', count: 20, description: '20 attendance records' },
            { type: 'notes', count: 8, description: '8 notes' },
            { type: 'homework', count: 5, description: '5 homework assignments' },
            { type: 'meetings', count: 2, description: '2 meetings' }
          ],
          hasAssociatedData: true
        }

        const grouped = getGroupedImpactItems(complexImpact)

        expect(grouped['Academic Records']).toHaveLength(4) // tests, test-results, notes, homework
        expect(grouped['Administrative']).toHaveLength(2) // students, attendance
        expect(grouped['Other']).toHaveLength(1) // meetings
      })

      it('should remove empty groups', () => {
        const simpleImpact = {
          affectedItems: [
            { type: 'students', count: 5, description: '5 students' }
          ],
          hasAssociatedData: true
        }

        const grouped = getGroupedImpactItems(simpleImpact)

        expect(grouped['Administrative']).toHaveLength(1)
        expect(grouped['Academic Records']).toBeUndefined()
        expect(grouped['Other']).toBeUndefined()
      })

      it('should handle empty impact items', () => {
        const emptyImpact = {
          affectedItems: [],
          hasAssociatedData: false
        }

        const grouped = getGroupedImpactItems(emptyImpact)

        expect(Object.keys(grouped)).toHaveLength(0)
      })
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should handle large datasets efficiently', async () => {
      // Mock large dataset
      const largeEnrolledStudents = Array.from({ length: 1000 }, (_, i) => `student-${i}`)
      
      mockAppDataService.getClass.mockResolvedValue({
        id: 'class-1',
        name: 'Large Class',
        enrolledStudents: largeEnrolledStudents
      })
      mockAppDataService.getSchedulesByClass.mockResolvedValue([])
      mockAppDataService.getClassNotesByClass.mockResolvedValue([])
      mockAppDataService.getAttendanceByClass.mockResolvedValue([])
      mockAppDataService.getTestsByClass.mockResolvedValue([])
      mockAppDataService.getHomeworkAssignmentsByClass.mockResolvedValue([])
      mockAppDataService.getMeetings.mockResolvedValue([])

      const startTime = Date.now()
      const impact = await calculateClassDeletionImpact('class-1')
      const endTime = Date.now()

      expect(impact.affectedItems[0].count).toBe(1000)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle null/undefined values gracefully', async () => {
      mockAppDataService.getClass.mockResolvedValue({
        id: 'class-1',
        name: 'Test Class',
        enrolledStudents: null // null instead of array
      })
      mockAppDataService.getSchedulesByClass.mockResolvedValue([])
      mockAppDataService.getClassNotesByClass.mockResolvedValue([])
      mockAppDataService.getAttendanceByClass.mockResolvedValue([])
      mockAppDataService.getTestsByClass.mockResolvedValue([])
      mockAppDataService.getHomeworkAssignmentsByClass.mockResolvedValue([])
      mockAppDataService.getMeetings.mockResolvedValue([])

      const impact = await calculateClassDeletionImpact('class-1')

      expect(impact.hasAssociatedData).toBe(false)
      expect(impact.affectedItems).toHaveLength(0)
    })

    it('should handle concurrent calculation requests', async () => {
      mockAppDataService.getClass.mockResolvedValue({
        id: 'class-1',
        name: 'Concurrent Class',
        enrolledStudents: ['student-1']
      })
      mockAppDataService.getSchedulesByClass.mockResolvedValue([])
      mockAppDataService.getClassNotesByClass.mockResolvedValue([])
      mockAppDataService.getAttendanceByClass.mockResolvedValue([])
      mockAppDataService.getTestsByClass.mockResolvedValue([])
      mockAppDataService.getHomeworkAssignmentsByClass.mockResolvedValue([])
      mockAppDataService.getMeetings.mockResolvedValue([])

      // Run multiple calculations concurrently
      const promises = Array.from({ length: 5 }, () => 
        calculateClassDeletionImpact('class-1')
      )

      const results = await Promise.all(promises)

      // All results should be identical
      results.forEach(result => {
        expect(result.hasAssociatedData).toBe(true)
        expect(result.affectedItems).toHaveLength(1)
        expect(result.affectedItems[0].count).toBe(1)
      })
    })
  })
})