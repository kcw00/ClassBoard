import { NotFoundError, ValidationError } from '../utils/errors'

// Mock Prisma Client
const mockPrisma = {
  student: {
    findMany: jest.fn(),
  },
  meeting: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
} as any

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma)
}))

import meetingService from '../services/meetingService'

describe('MeetingService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createMeeting', () => {
    const mockMeetingData = {
      title: 'Parent-Teacher Conference',
      description: 'Discuss student progress',
      date: '2024-01-15',
      startTime: '14:00',
      endTime: '15:00',
      participants: ['student-1', 'student-2'],
      participantType: 'students' as const,
      location: 'Room 101',
      meetingType: 'in_person' as const,
      status: 'scheduled' as const
    }

    it('should create meeting successfully', async () => {
      const mockStudents = [
        { id: 'student-1', name: 'John Doe' },
        { id: 'student-2', name: 'Jane Smith' }
      ]
      const mockCreatedMeeting = {
        id: 'meeting-1',
        ...mockMeetingData,
        createdDate: '2024-01-15'
      }

      mockPrisma.student.findMany.mockResolvedValue(mockStudents)
      mockPrisma.meeting.findMany.mockResolvedValue([]) // No conflicts
      mockPrisma.meeting.create.mockResolvedValue(mockCreatedMeeting)

      const result = await meetingService.createMeeting(mockMeetingData)

      expect(result).toEqual(mockCreatedMeeting)
      expect(mockPrisma.student.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['student-1', 'student-2'] } }
      })
    })

    it('should throw ValidationError if students do not exist', async () => {
      const mockStudents = [
        { id: 'student-1', name: 'John Doe' }
      ]

      mockPrisma.student.findMany.mockResolvedValue(mockStudents)

      await expect(meetingService.createMeeting(mockMeetingData))
        .rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError for scheduling conflicts', async () => {
      const mockStudents = [
        { id: 'student-1', name: 'John Doe' },
        { id: 'student-2', name: 'Jane Smith' }
      ]
      const mockConflictingMeeting = {
        id: 'meeting-2',
        date: '2024-01-15',
        startTime: '13:30',
        endTime: '14:30',
        participants: ['student-1'],
        status: 'scheduled'
      }

      mockPrisma.student.findMany.mockResolvedValue(mockStudents)
      mockPrisma.meeting.findMany.mockResolvedValue([mockConflictingMeeting])

      await expect(meetingService.createMeeting(mockMeetingData))
        .rejects.toThrow(ValidationError)
    })

    it('should not validate student IDs for non-student participant types', async () => {
      const meetingData = {
        ...mockMeetingData,
        participantType: 'parents' as const,
        participants: ['parent-1', 'parent-2']
      }
      const mockCreatedMeeting = {
        id: 'meeting-1',
        ...meetingData,
        createdDate: '2024-01-15'
      }

      mockPrisma.meeting.findMany.mockResolvedValue([]) // No conflicts
      mockPrisma.meeting.create.mockResolvedValue(mockCreatedMeeting)

      const result = await meetingService.createMeeting(meetingData)

      expect(result).toEqual(mockCreatedMeeting)
      expect(mockPrisma.student.findMany).not.toHaveBeenCalled()
    })
  })

  describe('getMeetings', () => {
    it('should return paginated meetings', async () => {
      const mockMeetings = [
        {
          id: 'meeting-1',
          title: 'Parent-Teacher Conference',
          date: '2024-01-15',
          startTime: '14:00',
          endTime: '15:00'
        }
      ]

      mockPrisma.meeting.findMany.mockResolvedValue(mockMeetings)
      mockPrisma.meeting.count.mockResolvedValue(1)

      const result = await meetingService.getMeetings({ page: 1, limit: 10 })

      expect(result).toEqual({
        meetings: mockMeetings,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      })
    })

    it('should filter by date range', async () => {
      const mockMeetings: any[] = []
      mockPrisma.meeting.findMany.mockResolvedValue(mockMeetings)
      mockPrisma.meeting.count.mockResolvedValue(0)

      await meetingService.getMeetings({ 
        startDate: '2024-01-01', 
        endDate: '2024-01-31' 
      })

      expect(mockPrisma.meeting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            date: {
              gte: '2024-01-01',
              lte: '2024-01-31'
            }
          }
        })
      )
    })

    it('should filter by participant', async () => {
      const mockMeetings: any[] = []
      mockPrisma.meeting.findMany.mockResolvedValue(mockMeetings)
      mockPrisma.meeting.count.mockResolvedValue(0)

      await meetingService.getMeetings({ participant: 'student-1' })

      expect(mockPrisma.meeting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            participants: {
              has: 'student-1'
            }
          }
        })
      )
    })
  })

  describe('getMeetingById', () => {
    it('should return meeting by ID', async () => {
      const mockMeeting = {
        id: 'meeting-1',
        title: 'Parent-Teacher Conference',
        date: '2024-01-15'
      }

      mockPrisma.meeting.findUnique.mockResolvedValue(mockMeeting)

      const result = await meetingService.getMeetingById('meeting-1')

      expect(result).toEqual(mockMeeting)
      expect(mockPrisma.meeting.findUnique).toHaveBeenCalledWith({
        where: { id: 'meeting-1' }
      })
    })

    it('should throw NotFoundError if meeting does not exist', async () => {
      mockPrisma.meeting.findUnique.mockResolvedValue(null)

      await expect(meetingService.getMeetingById('nonexistent'))
        .rejects.toThrow(NotFoundError)
    })
  })

  describe('updateMeeting', () => {
    it('should update meeting successfully', async () => {
      const mockExistingMeeting = {
        id: 'meeting-1',
        title: 'Old Title',
        date: '2024-01-15',
        startTime: '14:00',
        endTime: '15:00',
        participants: ['student-1']
      }
      const mockUpdatedMeeting = {
        ...mockExistingMeeting,
        title: 'New Title'
      }
      const updateData = { title: 'New Title' }

      mockPrisma.meeting.findUnique.mockResolvedValue(mockExistingMeeting)
      mockPrisma.meeting.update.mockResolvedValue(mockUpdatedMeeting)

      const result = await meetingService.updateMeeting('meeting-1', updateData)

      expect(result).toEqual(mockUpdatedMeeting)
    })

    it('should throw NotFoundError if meeting does not exist', async () => {
      mockPrisma.meeting.findUnique.mockResolvedValue(null)

      await expect(meetingService.updateMeeting('nonexistent', {}))
        .rejects.toThrow(NotFoundError)
    })

    it('should check for conflicts when updating time', async () => {
      const mockExistingMeeting = {
        id: 'meeting-1',
        title: 'Meeting',
        date: '2024-01-15',
        startTime: '14:00',
        endTime: '15:00',
        participants: ['student-1']
      }
      const mockConflictingMeeting = {
        id: 'meeting-2',
        date: '2024-01-15',
        startTime: '13:30',
        endTime: '14:30',
        participants: ['student-1'],
        status: 'scheduled'
      }

      mockPrisma.meeting.findUnique.mockResolvedValue(mockExistingMeeting)
      mockPrisma.meeting.findMany.mockResolvedValue([mockConflictingMeeting])

      await expect(meetingService.updateMeeting('meeting-1', { startTime: '13:45' }))
        .rejects.toThrow(ValidationError)
    })
  })

  describe('deleteMeeting', () => {
    it('should delete meeting successfully', async () => {
      const mockMeeting = { id: 'meeting-1' }

      mockPrisma.meeting.findUnique.mockResolvedValue(mockMeeting)
      mockPrisma.meeting.delete.mockResolvedValue(mockMeeting)

      await meetingService.deleteMeeting('meeting-1')

      expect(mockPrisma.meeting.delete).toHaveBeenCalledWith({
        where: { id: 'meeting-1' }
      })
    })

    it('should throw NotFoundError if meeting does not exist', async () => {
      mockPrisma.meeting.findUnique.mockResolvedValue(null)

      await expect(meetingService.deleteMeeting('nonexistent'))
        .rejects.toThrow(NotFoundError)
    })
  })

  describe('cancelMeeting', () => {
    it('should cancel meeting successfully', async () => {
      const mockMeeting = {
        id: 'meeting-1',
        status: 'scheduled',
        notes: 'Original notes'
      }
      const mockUpdatedMeeting = {
        ...mockMeeting,
        status: 'cancelled',
        notes: 'Original notes\nCancellation reason: Emergency'
      }

      mockPrisma.meeting.findUnique.mockResolvedValue(mockMeeting)
      mockPrisma.meeting.update.mockResolvedValue(mockUpdatedMeeting)

      const result = await meetingService.cancelMeeting('meeting-1', 'Emergency')

      expect(result).toEqual(mockUpdatedMeeting)
      expect(mockPrisma.meeting.update).toHaveBeenCalledWith({
        where: { id: 'meeting-1' },
        data: {
          status: 'cancelled',
          notes: 'Original notes\nCancellation reason: Emergency'
        }
      })
    })

    it('should throw ValidationError if meeting is already cancelled', async () => {
      const mockMeeting = {
        id: 'meeting-1',
        status: 'cancelled'
      }

      mockPrisma.meeting.findUnique.mockResolvedValue(mockMeeting)

      await expect(meetingService.cancelMeeting('meeting-1'))
        .rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError if meeting is completed', async () => {
      const mockMeeting = {
        id: 'meeting-1',
        status: 'completed'
      }

      mockPrisma.meeting.findUnique.mockResolvedValue(mockMeeting)

      await expect(meetingService.cancelMeeting('meeting-1'))
        .rejects.toThrow(ValidationError)
    })
  })

  describe('completeMeeting', () => {
    it('should complete meeting successfully', async () => {
      const mockMeeting = {
        id: 'meeting-1',
        status: 'scheduled',
        notes: 'Original notes'
      }
      const mockUpdatedMeeting = {
        ...mockMeeting,
        status: 'completed',
        notes: 'Original notes\nMeeting notes: Great discussion'
      }

      mockPrisma.meeting.findUnique.mockResolvedValue(mockMeeting)
      mockPrisma.meeting.update.mockResolvedValue(mockUpdatedMeeting)

      const result = await meetingService.completeMeeting('meeting-1', 'Great discussion')

      expect(result).toEqual(mockUpdatedMeeting)
    })

    it('should throw ValidationError if meeting is already completed', async () => {
      const mockMeeting = {
        id: 'meeting-1',
        status: 'completed'
      }

      mockPrisma.meeting.findUnique.mockResolvedValue(mockMeeting)

      await expect(meetingService.completeMeeting('meeting-1'))
        .rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError if meeting is cancelled', async () => {
      const mockMeeting = {
        id: 'meeting-1',
        status: 'cancelled'
      }

      mockPrisma.meeting.findUnique.mockResolvedValue(mockMeeting)

      await expect(meetingService.completeMeeting('meeting-1'))
        .rejects.toThrow(ValidationError)
    })
  })

  describe('getMeetingsByParticipant', () => {
    it('should return meetings for specific participant', async () => {
      const mockMeetings = [
        {
          id: 'meeting-1',
          participants: ['student-1', 'student-2']
        }
      ]

      mockPrisma.meeting.findMany.mockResolvedValue(mockMeetings)
      mockPrisma.meeting.count.mockResolvedValue(1)

      const result = await meetingService.getMeetingsByParticipant('student-1')

      expect(result.meetings).toEqual(mockMeetings)
      expect(mockPrisma.meeting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            participants: {
              has: 'student-1'
            }
          }
        })
      )
    })
  })

  describe('getMeetingsByDateRange', () => {
    it('should return meetings in date range', async () => {
      const mockMeetings = [
        {
          id: 'meeting-1',
          date: '2024-01-15'
        }
      ]

      mockPrisma.meeting.findMany.mockResolvedValue(mockMeetings)
      mockPrisma.meeting.count.mockResolvedValue(1)

      const result = await meetingService.getMeetingsByDateRange('2024-01-01', '2024-01-31')

      expect(result).toEqual(mockMeetings)
    })
  })
})