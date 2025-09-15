import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import {
  calculateClassDeletionImpact,
  calculateStudentDeletionImpact,
  formatImpactInformation,
  getTotalAffectedCount,
  isHighImpactDeletion,
  getGroupedImpactItems,
  type DeletionImpact
} from '../impactCalculation'
import { appDataService } from '@/services/AppDataService'

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

const mockedAppDataService = jest.mocked(appDataService)

describe('impactCalculation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('calculateClassDeletionImpact', () => {
    it('should calculate impact for class with no associated data', async () => {
      // Mock empty responses
      mockedAppDataService.getClass.mockResolvedValue({
        id: 'class1',
        name: 'Math 101',
        subject: 'Mathematics',
        description: 'Basic math',
        room: 'A101',
        capacity: 30,
        enrolledStudents: [],
        createdDate: '2024-01-01',
        color: '#3b82f6'
      })
      mockedAppDataService.getSchedulesByClass.mockResolvedValue([])
      mockedAppDataService.getClassNotesByClass.mockResolvedValue([])
      mockedAppDataService.getAttendanceByClass.mockResolvedValue([])
      mockedAppDataService.getTestsByClass.mockResolvedValue([])
      mockedAppDataService.getHomeworkAssignmentsByClass.mockResolvedValue([])
      mockedAppDataService.getMeetings.mockResolvedValue([])

      const result = await calculateClassDeletionImpact('class1')

      expect(result.hasAssociatedData).toBe(false)
      expect(result.affectedItems).toHaveLength(0)
      expect(result.warningMessage).toBeUndefined()
    })

    it('should calculate impact for class with enrolled students', async () => {
      mockedAppDataService.getClass.mockResolvedValue({
        id: 'class1',
        name: 'Math 101',
        subject: 'Mathematics',
        description: 'Basic math',
        room: 'A101',
        capacity: 30,
        enrolledStudents: ['student1', 'student2', 'student3'],
        createdDate: '2024-01-01',
        color: '#3b82f6'
      })
      mockedAppDataService.getSchedulesByClass.mockResolvedValue([])
      mockedAppDataService.getClassNotesByClass.mockResolvedValue([])
      mockedAppDataService.getAttendanceByClass.mockResolvedValue([])
      mockedAppDataService.getTestsByClass.mockResolvedValue([])
      mockedAppDataService.getHomeworkAssignmentsByClass.mockResolvedValue([])
      mockedAppDataService.getMeetings.mockResolvedValue([])

      const result = await calculateClassDeletionImpact('class1')

      expect(result.hasAssociatedData).toBe(true)
      expect(result.affectedItems).toHaveLength(1)
      expect(result.affectedItems[0]).toEqual({
        type: 'students',
        count: 3,
        description: '3 enrolled students will be unenrolled'
      })
      expect(result.warningMessage).toBeDefined()
    })

    it('should handle errors gracefully', async () => {
      mockedAppDataService.getClass.mockRejectedValue(new Error('Network error'))

      await expect(calculateClassDeletionImpact('class1')).rejects.toThrow('Failed to calculate deletion impact. Please try again.')
    })
  })

  describe('calculateStudentDeletionImpact', () => {
    it('should calculate impact for student with no associated data', async () => {
      mockedAppDataService.getClasses.mockResolvedValue([])
      mockedAppDataService.getAttendanceRecords.mockResolvedValue([])
      mockedAppDataService.getTestResults.mockResolvedValue([])
      mockedAppDataService.getHomeworkSubmissions.mockResolvedValue([])
      mockedAppDataService.getMeetings.mockResolvedValue([])

      const result = await calculateStudentDeletionImpact('student1')

      expect(result.hasAssociatedData).toBe(false)
      expect(result.affectedItems).toHaveLength(0)
      expect(result.warningMessage).toBeUndefined()
    })

    it('should calculate impact for student enrolled in classes', async () => {
      mockedAppDataService.getClasses.mockResolvedValue([
        {
          id: 'class1',
          name: 'Math 101',
          subject: 'Mathematics',
          description: 'Basic math',
          room: 'A101',
          capacity: 30,
          enrolledStudents: ['student1', 'student2'],
          createdDate: '2024-01-01',
          color: '#3b82f6'
        },
        {
          id: 'class2',
          name: 'Science 101',
          subject: 'Science',
          description: 'Basic science',
          room: 'B101',
          capacity: 25,
          enrolledStudents: ['student1'],
          createdDate: '2024-01-01',
          color: '#10b981'
        }
      ])
      mockedAppDataService.getAttendanceRecords.mockResolvedValue([])
      mockedAppDataService.getTestResults.mockResolvedValue([])
      mockedAppDataService.getHomeworkSubmissions.mockResolvedValue([])
      mockedAppDataService.getMeetings.mockResolvedValue([])

      const result = await calculateStudentDeletionImpact('student1')

      expect(result.hasAssociatedData).toBe(true)
      expect(result.affectedItems).toHaveLength(1)
      expect(result.affectedItems[0]).toEqual({
        type: 'classes',
        count: 2,
        description: 'Student will be unenrolled from 2 classes'
      })
    })

    it('should handle errors gracefully', async () => {
      mockedAppDataService.getClasses.mockRejectedValue(new Error('Network error'))

      await expect(calculateStudentDeletionImpact('student1')).rejects.toThrow('Failed to calculate deletion impact. Please try again.')
    })
  })

  describe('formatImpactInformation', () => {
    it('should format impact with no associated data', () => {
      const impact: DeletionImpact = {
        affectedItems: [],
        hasAssociatedData: false
      }

      const result = formatImpactInformation(impact)
      expect(result).toBe('No related data will be affected by this deletion.')
    })

    it('should format impact with multiple items', () => {
      const impact: DeletionImpact = {
        affectedItems: [
          { type: 'students', count: 3, description: '3 enrolled students will be unenrolled' },
          { type: 'notes', count: 2, description: '2 class notes will be deleted' }
        ],
        hasAssociatedData: true
      }

      const result = formatImpactInformation(impact)
      expect(result).toBe('• 3 enrolled students will be unenrolled\n• 2 class notes will be deleted')
    })
  })

  describe('getTotalAffectedCount', () => {
    it('should return 0 for no affected items', () => {
      const impact: DeletionImpact = {
        affectedItems: [],
        hasAssociatedData: false
      }

      expect(getTotalAffectedCount(impact)).toBe(0)
    })

    it('should sum all affected counts', () => {
      const impact: DeletionImpact = {
        affectedItems: [
          { type: 'students', count: 3, description: '3 students' },
          { type: 'notes', count: 5, description: '5 notes' },
          { type: 'tests', count: 2, description: '2 tests' }
        ],
        hasAssociatedData: true
      }

      expect(getTotalAffectedCount(impact)).toBe(10)
    })
  })

  describe('isHighImpactDeletion', () => {
    it('should return false for low impact deletion', () => {
      const impact: DeletionImpact = {
        affectedItems: [
          { type: 'students', count: 2, description: '2 students' },
          { type: 'notes', count: 3, description: '3 notes' }
        ],
        hasAssociatedData: true
      }

      expect(isHighImpactDeletion(impact)).toBe(false)
    })

    it('should return true for high impact deletion', () => {
      const impact: DeletionImpact = {
        affectedItems: [
          { type: 'students', count: 5, description: '5 students' },
          { type: 'notes', count: 8, description: '8 notes' }
        ],
        hasAssociatedData: true
      }

      expect(isHighImpactDeletion(impact)).toBe(true)
    })
  })

  describe('getGroupedImpactItems', () => {
    it('should group impact items by category', () => {
      const impact: DeletionImpact = {
        affectedItems: [
          { type: 'students', count: 3, description: '3 students' },
          { type: 'tests', count: 2, description: '2 tests' },
          { type: 'notes', count: 4, description: '4 notes' },
          { type: 'attendance', count: 5, description: '5 attendance records' }
        ],
        hasAssociatedData: true
      }

      const result = getGroupedImpactItems(impact)

      expect(result['Academic Records']).toHaveLength(2)
      expect(result['Administrative']).toHaveLength(2)
      expect(result['Academic Records']).toContainEqual({ type: 'tests', count: 2, description: '2 tests' })
      expect(result['Academic Records']).toContainEqual({ type: 'notes', count: 4, description: '4 notes' })
      expect(result['Administrative']).toContainEqual({ type: 'students', count: 3, description: '3 students' })
      expect(result['Administrative']).toContainEqual({ type: 'attendance', count: 5, description: '5 attendance records' })
    })

    it('should remove empty groups', () => {
      const impact: DeletionImpact = {
        affectedItems: [
          { type: 'students', count: 3, description: '3 students' }
        ],
        hasAssociatedData: true
      }

      const result = getGroupedImpactItems(impact)

      expect(result['Administrative']).toHaveLength(1)
      expect(result['Academic Records']).toBeUndefined()
      expect(result['Other']).toBeUndefined()
    })
  })
})