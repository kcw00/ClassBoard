import { PrismaClient, Meeting, MeetingType, MeetingStatus, ParticipantType } from '@prisma/client'
import { NotFoundError, ValidationError } from '../utils/errors'

const prisma = new PrismaClient()

export interface CreateMeetingData {
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  participants: string[]
  participantType: ParticipantType
  location: string
  meetingType: MeetingType
  status?: MeetingStatus
  notes?: string
}

export interface UpdateMeetingData {
  title?: string
  description?: string
  date?: string
  startTime?: string
  endTime?: string
  participants?: string[]
  participantType?: ParticipantType
  location?: string
  meetingType?: MeetingType
  status?: MeetingStatus
  notes?: string
}

export interface MeetingQueryOptions {
  date?: string
  startDate?: string
  endDate?: string
  meetingType?: MeetingType
  status?: MeetingStatus
  participantType?: ParticipantType
  participant?: string
  page?: number
  limit?: number
}

class MeetingService {
  async createMeeting(data: CreateMeetingData): Promise<Meeting> {
    // Validate participants based on participant type
    if (data.participantType === 'students') {
      // Verify student IDs exist
      const students = await prisma.student.findMany({
        where: { id: { in: data.participants } }
      })
      
      if (students.length !== data.participants.length) {
        const foundIds = students.map(s => s.id)
        const notFoundIds = data.participants.filter(id => !foundIds.includes(id))
        throw new ValidationError(`Students not found: ${notFoundIds.join(', ')}`)
      }
    }

    // Check for scheduling conflicts
    const conflictingMeetings = await prisma.meeting.findMany({
      where: {
        date: data.date,
        status: { not: 'cancelled' },
        OR: [
          {
            AND: [
              { startTime: { lte: data.startTime } },
              { endTime: { gt: data.startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: data.endTime } },
              { endTime: { gte: data.endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: data.startTime } },
              { endTime: { lte: data.endTime } }
            ]
          }
        ]
      }
    })

    // Check if any participants have conflicts
    const participantConflicts = conflictingMeetings.filter(meeting => 
      meeting.participants.some(participant => data.participants.includes(participant))
    )

    if (participantConflicts.length > 0) {
      throw new ValidationError(`Scheduling conflict detected. Participants have overlapping meetings on ${data.date}`)
    }

    const currentDate = new Date().toISOString().split('T')[0]

    const meeting = await prisma.meeting.create({
      data: {
        title: data.title,
        description: data.description,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        participants: data.participants,
        participantType: data.participantType,
        location: data.location,
        meetingType: data.meetingType,
        status: data.status || 'scheduled',
        notes: data.notes,
        createdDate: currentDate
      }
    })

    return meeting
  }

  async getMeetings(options: MeetingQueryOptions = {}): Promise<{
    meetings: Meeting[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    const page = options.page || 1
    const limit = options.limit || 10
    const skip = (page - 1) * limit

    const where: any = {}

    if (options.date) {
      where.date = options.date
    }

    if (options.startDate && options.endDate) {
      where.date = {
        gte: options.startDate,
        lte: options.endDate
      }
    } else if (options.startDate) {
      where.date = { gte: options.startDate }
    } else if (options.endDate) {
      where.date = { lte: options.endDate }
    }

    if (options.meetingType) {
      where.meetingType = options.meetingType
    }

    if (options.status) {
      where.status = options.status
    }

    if (options.participantType) {
      where.participantType = options.participantType
    }

    if (options.participant) {
      where.participants = {
        has: options.participant
      }
    }

    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        orderBy: [
          { date: 'asc' },
          { startTime: 'asc' }
        ],
        skip,
        take: limit
      }),
      prisma.meeting.count({ where })
    ])

    return {
      meetings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  async getMeetingById(id: string): Promise<Meeting> {
    const meeting = await prisma.meeting.findUnique({
      where: { id }
    })

    if (!meeting) {
      throw new NotFoundError('Meeting not found')
    }

    return meeting
  }

  async updateMeeting(id: string, data: UpdateMeetingData): Promise<Meeting> {
    const existingMeeting = await prisma.meeting.findUnique({
      where: { id }
    })

    if (!existingMeeting) {
      throw new NotFoundError('Meeting not found')
    }

    // Validate participants if being updated
    if (data.participants && data.participantType === 'students') {
      const students = await prisma.student.findMany({
        where: { id: { in: data.participants } }
      })
      
      if (students.length !== data.participants.length) {
        const foundIds = students.map(s => s.id)
        const notFoundIds = data.participants.filter(id => !foundIds.includes(id))
        throw new ValidationError(`Students not found: ${notFoundIds.join(', ')}`)
      }
    }

    // Check for scheduling conflicts if date or time is being updated
    if (data.date || data.startTime || data.endTime) {
      const meetingDate = data.date || existingMeeting.date
      const startTime = data.startTime || existingMeeting.startTime
      const endTime = data.endTime || existingMeeting.endTime
      const participants = data.participants || existingMeeting.participants

      const conflictingMeetings = await prisma.meeting.findMany({
        where: {
          id: { not: id }, // Exclude current meeting
          date: meetingDate,
          status: { not: 'cancelled' },
          OR: [
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } }
              ]
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } }
              ]
            },
            {
              AND: [
                { startTime: { gte: startTime } },
                { endTime: { lte: endTime } }
              ]
            }
          ]
        }
      })

      const participantConflicts = conflictingMeetings.filter(meeting => 
        meeting.participants.some(participant => participants.includes(participant))
      )

      if (participantConflicts.length > 0) {
        throw new ValidationError(`Scheduling conflict detected. Participants have overlapping meetings on ${meetingDate}`)
      }
    }

    const updatedMeeting = await prisma.meeting.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.date && { date: data.date }),
        ...(data.startTime && { startTime: data.startTime }),
        ...(data.endTime && { endTime: data.endTime }),
        ...(data.participants && { participants: data.participants }),
        ...(data.participantType && { participantType: data.participantType }),
        ...(data.location && { location: data.location }),
        ...(data.meetingType && { meetingType: data.meetingType }),
        ...(data.status && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes })
      }
    })

    return updatedMeeting
  }

  async deleteMeeting(id: string): Promise<void> {
    const meeting = await prisma.meeting.findUnique({
      where: { id }
    })

    if (!meeting) {
      throw new NotFoundError('Meeting not found')
    }

    await prisma.meeting.delete({
      where: { id }
    })
  }

  async getMeetingsByParticipant(participantId: string, options: Omit<MeetingQueryOptions, 'participant'> = {}): Promise<{
    meetings: Meeting[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    return this.getMeetings({
      ...options,
      participant: participantId
    })
  }

  async getMeetingsByDateRange(startDate: string, endDate: string, options: Omit<MeetingQueryOptions, 'startDate' | 'endDate'> = {}): Promise<Meeting[]> {
    const result = await this.getMeetings({
      ...options,
      startDate,
      endDate,
      limit: 1000 // Get all meetings in range
    })

    return result.meetings
  }

  async cancelMeeting(id: string, reason?: string): Promise<Meeting> {
    const meeting = await this.getMeetingById(id)

    if (meeting.status === 'cancelled') {
      throw new ValidationError('Meeting is already cancelled')
    }

    if (meeting.status === 'completed') {
      throw new ValidationError('Cannot cancel a completed meeting')
    }

    const updatedMeeting = await prisma.meeting.update({
      where: { id },
      data: {
        status: 'cancelled',
        notes: reason ? `${meeting.notes || ''}\nCancellation reason: ${reason}`.trim() : meeting.notes
      }
    })

    return updatedMeeting
  }

  async completeMeeting(id: string, notes?: string): Promise<Meeting> {
    const meeting = await this.getMeetingById(id)

    if (meeting.status === 'completed') {
      throw new ValidationError('Meeting is already completed')
    }

    if (meeting.status === 'cancelled') {
      throw new ValidationError('Cannot complete a cancelled meeting')
    }

    const updatedMeeting = await prisma.meeting.update({
      where: { id },
      data: {
        status: 'completed',
        notes: notes ? `${meeting.notes || ''}\nMeeting notes: ${notes}`.trim() : meeting.notes
      }
    })

    return updatedMeeting
  }
}

export default new MeetingService()