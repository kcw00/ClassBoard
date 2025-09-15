import { NotFoundError, ValidationError } from '../utils/errors'

// Mock Prisma Client
const mockPrisma = {
  class: {
    findUnique: jest.fn(),
  },
  classEnrollment: {
    findMany: jest.fn(),
  },
  attendanceRecord: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  attendanceEntry: {
    deleteMany: jest.fn(),
  },
} as any

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma)
}))

import attendanceService from '../services/attendanceService'

describe('AttendanceService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createAttendanceRecord', () => {
    const mockAttendanceData = {
      classId: 'class-1',
      date: '2024-01-15',
      attendanceData: [
        { studentId: 'student-1', status: 'present' as const },
        { studentId: 'student-2', status: 'absent' as const, notes: 'Sick' }
      ]
    }

    it('should create attendance record successfully', async () => {
      const mockClass = { id: 'class-1', name: 'Math 101' }
      const mockEnrollments = [
        { studentId: 'student-1', student: { id: 'student-1', name: 'John Doe' } },
        { studentId: 'student-2', student: { id: 'student-2', name: 'Jane Smith' } }
      ]
      const mockCreatedRecord = {
        id: 'attendance-1',
        classId: 'class-1',
        date: '2024-01-15',
        createdDate: '2024-01-15',
        attendanceData: [
          { studentId: 'student-1', status: 'present', notes: null, student: { id: 'student-1', name: 'John Doe' } },
          { studentId: 'student-2', status: 'absent', notes: 'Sick', student: { id: 'student-2', name: 'Jane Smith' } }
        ],
        class: { id: 'class-1', name: 'Math 101', subject: 'Mathematics' }
      }

      mockPrisma.class.findUnique.mockResolvedValue(mockClass)
      mockPrisma.classEnrollment.findMany.mockResolvedValue(mockEnrollments)
      mockPrisma.attendanceRecord.findFirst.mockResolvedValue(null)
      mockPrisma.attendanceRecord.create.mockResolvedValue(mockCreatedRecord)

      const result = await attendanceService.createAttendanceRecord(mockAttendanceData)

      expect(result).toEqual(mockCreatedRecord)
      expect(mockPrisma.class.findUnique).toHaveBeenCalledWith({
        where: { id: 'class-1' }
      })
      expect(mockPrisma.classEnrollment.findMany).toHaveBeenCalledWith({
        where: {
          classId: 'class-1',
          studentId: { in: ['student-1', 'student-2'] }
        },
        include: { student: true }
      })
    })

    it('should throw NotFoundError if class does not exist', async () => {
      mockPrisma.class.findUnique.mockResolvedValue(null)

      await expect(attendanceService.createAttendanceRecord(mockAttendanceData))
        .rejects.toThrow(NotFoundError)
    })

    it('should throw ValidationError if students are not enrolled', async () => {
      const mockClass = { id: 'class-1', name: 'Math 101' }
      const mockEnrollments = [
        { studentId: 'student-1', student: { id: 'student-1', name: 'John Doe' } }
      ]

      mockPrisma.class.findUnique.mockResolvedValue(mockClass)
      mockPrisma.classEnrollment.findMany.mockResolvedValue(mockEnrollments)

      await expect(attendanceService.createAttendanceRecord(mockAttendanceData))
        .rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError if attendance record already exists', async () => {
      const mockClass = { id: 'class-1', name: 'Math 101' }
      const mockEnrollments = [
        { studentId: 'student-1', student: { id: 'student-1', name: 'John Doe' } },
        { studentId: 'student-2', student: { id: 'student-2', name: 'Jane Smith' } }
      ]
      const mockExistingRecord = { id: 'existing-1' }

      mockPrisma.class.findUnique.mockResolvedValue(mockClass)
      mockPrisma.classEnrollment.findMany.mockResolvedValue(mockEnrollments)
      mockPrisma.attendanceRecord.findFirst.mockResolvedValue(mockExistingRecord)

      await expect(attendanceService.createAttendanceRecord(mockAttendanceData))
        .rejects.toThrow(ValidationError)
    })
  })

  describe('getAttendanceRecords', () => {
    it('should return paginated attendance records', async () => {
      const mockRecords = [
        {
          id: 'attendance-1',
          classId: 'class-1',
          date: '2024-01-15',
          attendanceData: [],
          class: { id: 'class-1', name: 'Math 101', subject: 'Mathematics' }
        }
      ]

      mockPrisma.attendanceRecord.findMany.mockResolvedValue(mockRecords)
      mockPrisma.attendanceRecord.count.mockResolvedValue(1)

      const result = await attendanceService.getAttendanceRecords({ page: 1, limit: 10 })

      expect(result).toEqual({
        records: mockRecords,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      })
    })

    it('should filter by class ID', async () => {
      const mockRecords: any[] = []
      mockPrisma.attendanceRecord.findMany.mockResolvedValue(mockRecords)
      mockPrisma.attendanceRecord.count.mockResolvedValue(0)

      await attendanceService.getAttendanceRecords({ classId: 'class-1' })

      expect(mockPrisma.attendanceRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { classId: 'class-1' }
        })
      )
    })
  })

  describe('getAttendanceRecordById', () => {
    it('should return attendance record by ID', async () => {
      const mockRecord = {
        id: 'attendance-1',
        classId: 'class-1',
        date: '2024-01-15',
        attendanceData: [],
        class: { id: 'class-1', name: 'Math 101', subject: 'Mathematics' }
      }

      mockPrisma.attendanceRecord.findUnique.mockResolvedValue(mockRecord)

      const result = await attendanceService.getAttendanceRecordById('attendance-1')

      expect(result).toEqual(mockRecord)
      expect(mockPrisma.attendanceRecord.findUnique).toHaveBeenCalledWith({
        where: { id: 'attendance-1' },
        include: expect.any(Object)
      })
    })

    it('should throw NotFoundError if record does not exist', async () => {
      mockPrisma.attendanceRecord.findUnique.mockResolvedValue(null)

      await expect(attendanceService.getAttendanceRecordById('nonexistent'))
        .rejects.toThrow(NotFoundError)
    })
  })

  describe('updateAttendanceRecord', () => {
    it('should update attendance record successfully', async () => {
      const mockExistingRecord = {
        id: 'attendance-1',
        classId: 'class-1',
        attendanceData: []
      }
      const mockUpdatedRecord = {
        id: 'attendance-1',
        classId: 'class-1',
        date: '2024-01-16',
        attendanceData: [],
        class: { id: 'class-1', name: 'Math 101', subject: 'Mathematics' }
      }
      const updateData = { date: '2024-01-16' }

      mockPrisma.attendanceRecord.findUnique.mockResolvedValue(mockExistingRecord)
      mockPrisma.attendanceRecord.update.mockResolvedValue(mockUpdatedRecord)

      const result = await attendanceService.updateAttendanceRecord('attendance-1', updateData)

      expect(result).toEqual(mockUpdatedRecord)
    })

    it('should throw NotFoundError if record does not exist', async () => {
      mockPrisma.attendanceRecord.findUnique.mockResolvedValue(null)

      await expect(attendanceService.updateAttendanceRecord('nonexistent', {}))
        .rejects.toThrow(NotFoundError)
    })
  })

  describe('deleteAttendanceRecord', () => {
    it('should delete attendance record successfully', async () => {
      const mockRecord = { id: 'attendance-1' }

      mockPrisma.attendanceRecord.findUnique.mockResolvedValue(mockRecord)
      mockPrisma.attendanceRecord.delete.mockResolvedValue(mockRecord)

      await attendanceService.deleteAttendanceRecord('attendance-1')

      expect(mockPrisma.attendanceRecord.delete).toHaveBeenCalledWith({
        where: { id: 'attendance-1' }
      })
    })

    it('should throw NotFoundError if record does not exist', async () => {
      mockPrisma.attendanceRecord.findUnique.mockResolvedValue(null)

      await expect(attendanceService.deleteAttendanceRecord('nonexistent'))
        .rejects.toThrow(NotFoundError)
    })
  })

  describe('getAttendanceAnalytics', () => {
    it('should calculate attendance analytics', async () => {
      const mockRecords = [
        {
          id: 'attendance-1',
          classId: 'class-1',
          date: '2024-01-15',
          attendanceData: [
            { studentId: 'student-1', status: 'present', student: { id: 'student-1', name: 'John Doe' } },
            { studentId: 'student-2', status: 'absent', student: { id: 'student-2', name: 'Jane Smith' } }
          ],
          class: { id: 'class-1', name: 'Math 101' }
        }
      ]

      mockPrisma.attendanceRecord.findMany.mockResolvedValue(mockRecords)

      const result = await attendanceService.getAttendanceAnalytics({
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      })

      expect(result).toEqual({
        totalRecords: 2,
        presentCount: 1,
        absentCount: 1,
        lateCount: 0,
        excusedCount: 0,
        attendanceRate: 50
      })
    })

    it('should provide breakdown by student when requested', async () => {
      const mockRecords = [
        {
          id: 'attendance-1',
          classId: 'class-1',
          date: '2024-01-15',
          attendanceData: [
            { studentId: 'student-1', status: 'present', student: { id: 'student-1', name: 'John Doe' } },
            { studentId: 'student-2', status: 'absent', student: { id: 'student-2', name: 'Jane Smith' } }
          ],
          class: { id: 'class-1', name: 'Math 101' }
        }
      ]

      mockPrisma.attendanceRecord.findMany.mockResolvedValue(mockRecords)

      const result = await attendanceService.getAttendanceAnalytics({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        groupBy: 'student'
      })

      expect(result.breakdown).toHaveLength(2)
      expect(result.breakdown![0]).toEqual({
        id: 'student-1',
        name: 'John Doe',
        presentCount: 1,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        attendanceRate: 100
      })
    })
  })
})