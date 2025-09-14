import { PrismaClient, AttendanceRecord, AttendanceEntry, AttendanceStatus } from '@prisma/client'
import { NotFoundError, ValidationError } from '../utils/errors'

const prisma = new PrismaClient()

export interface CreateAttendanceRecordData {
  classId: string
  date: string
  attendanceData: Array<{
    studentId: string
    status: AttendanceStatus
    notes?: string
  }>
}

export interface UpdateAttendanceRecordData {
  date?: string
  attendanceData?: Array<{
    studentId: string
    status: AttendanceStatus
    notes?: string
  }>
}

export interface AttendanceRecordWithEntries extends AttendanceRecord {
  attendanceData: AttendanceEntry[]
  class: {
    id: string
    name: string
    subject: string
  }
}

export interface AttendanceQueryOptions {
  classId?: string
  date?: string
  startDate?: string
  endDate?: string
  studentId?: string
  status?: AttendanceStatus
  page?: number
  limit?: number
}

export interface AttendanceAnalyticsOptions {
  classId?: string
  studentId?: string
  startDate: string
  endDate: string
  groupBy?: 'student' | 'class' | 'date'
}

export interface AttendanceAnalytics {
  totalRecords: number
  presentCount: number
  absentCount: number
  lateCount: number
  excusedCount: number
  attendanceRate: number
  breakdown?: Array<{
    id: string
    name: string
    presentCount: number
    absentCount: number
    lateCount: number
    excusedCount: number
    attendanceRate: number
  }>
}

class AttendanceService {
  async createAttendanceRecord(data: CreateAttendanceRecordData): Promise<AttendanceRecordWithEntries> {
    // Verify class exists
    const classExists = await prisma.class.findUnique({
      where: { id: data.classId }
    })

    if (!classExists) {
      throw new NotFoundError('Class not found')
    }

    // Verify all students exist and are enrolled in the class
    const studentIds = data.attendanceData.map(entry => entry.studentId)
    const enrolledStudents = await prisma.classEnrollment.findMany({
      where: {
        classId: data.classId,
        studentId: { in: studentIds }
      },
      include: {
        student: true
      }
    })

    if (enrolledStudents.length !== studentIds.length) {
      const enrolledStudentIds = enrolledStudents.map(e => e.studentId)
      const notEnrolledIds = studentIds.filter(id => !enrolledStudentIds.includes(id))
      throw new ValidationError(`Students not enrolled in class: ${notEnrolledIds.join(', ')}`)
    }

    // Check if attendance record already exists for this class and date
    const existingRecord = await prisma.attendanceRecord.findFirst({
      where: {
        classId: data.classId,
        date: data.date
      }
    })

    if (existingRecord) {
      throw new ValidationError(`Attendance record already exists for class on ${data.date}`)
    }

    const currentDate = new Date().toISOString().split('T')[0]

    // Create attendance record with entries
    const attendanceRecord = await prisma.attendanceRecord.create({
      data: {
        classId: data.classId,
        date: data.date,
        createdDate: currentDate,
        attendanceData: {
          create: data.attendanceData.map(entry => ({
            studentId: entry.studentId,
            status: entry.status,
            notes: entry.notes
          }))
        }
      },
      include: {
        attendanceData: {
          include: {
            student: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            subject: true
          }
        }
      }
    })

    return attendanceRecord
  }

  async getAttendanceRecords(options: AttendanceQueryOptions = {}): Promise<{
    records: AttendanceRecordWithEntries[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    const page = options.page || 1
    const limit = options.limit || 10
    const skip = (page - 1) * limit

    const where: any = {}

    if (options.classId) {
      where.classId = options.classId
    }

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

    if (options.studentId || options.status) {
      where.attendanceData = {
        some: {
          ...(options.studentId && { studentId: options.studentId }),
          ...(options.status && { status: options.status })
        }
      }
    }

    const [records, total] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where,
        include: {
          attendanceData: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          class: {
            select: {
              id: true,
              name: true,
              subject: true
            }
          }
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit
      }),
      prisma.attendanceRecord.count({ where })
    ])

    return {
      records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  async getAttendanceRecordById(id: string): Promise<AttendanceRecordWithEntries> {
    const record = await prisma.attendanceRecord.findUnique({
      where: { id },
      include: {
        attendanceData: {
          include: {
            student: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            subject: true
          }
        }
      }
    })

    if (!record) {
      throw new NotFoundError('Attendance record not found')
    }

    return record
  }

  async updateAttendanceRecord(id: string, data: UpdateAttendanceRecordData): Promise<AttendanceRecordWithEntries> {
    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: { id },
      include: { attendanceData: true }
    })

    if (!existingRecord) {
      throw new NotFoundError('Attendance record not found')
    }

    const currentDate = new Date().toISOString().split('T')[0]

    // If updating attendance data, verify students are enrolled
    if (data.attendanceData) {
      const studentIds = data.attendanceData.map(entry => entry.studentId)
      const enrolledStudents = await prisma.classEnrollment.findMany({
        where: {
          classId: existingRecord.classId,
          studentId: { in: studentIds }
        }
      })

      if (enrolledStudents.length !== studentIds.length) {
        const enrolledStudentIds = enrolledStudents.map(e => e.studentId)
        const notEnrolledIds = studentIds.filter(id => !enrolledStudentIds.includes(id))
        throw new ValidationError(`Students not enrolled in class: ${notEnrolledIds.join(', ')}`)
      }

      // Delete existing attendance entries and create new ones
      await prisma.attendanceEntry.deleteMany({
        where: { attendanceRecordId: id }
      })
    }

    const updatedRecord = await prisma.attendanceRecord.update({
      where: { id },
      data: {
        ...(data.date && { date: data.date }),
        updatedDate: currentDate,
        ...(data.attendanceData && {
          attendanceData: {
            create: data.attendanceData.map(entry => ({
              studentId: entry.studentId,
              status: entry.status,
              notes: entry.notes
            }))
          }
        })
      },
      include: {
        attendanceData: {
          include: {
            student: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            subject: true
          }
        }
      }
    })

    return updatedRecord
  }

  async deleteAttendanceRecord(id: string): Promise<void> {
    const record = await prisma.attendanceRecord.findUnique({
      where: { id }
    })

    if (!record) {
      throw new NotFoundError('Attendance record not found')
    }

    await prisma.attendanceRecord.delete({
      where: { id }
    })
  }

  async getAttendanceAnalytics(options: AttendanceAnalyticsOptions): Promise<AttendanceAnalytics> {
    const where: any = {
      date: {
        gte: options.startDate,
        lte: options.endDate
      }
    }

    if (options.classId) {
      where.classId = options.classId
    }

    if (options.studentId) {
      where.attendanceData = {
        some: {
          studentId: options.studentId
        }
      }
    }

    const records = await prisma.attendanceRecord.findMany({
      where,
      include: {
        attendanceData: {
          include: {
            student: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        class: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Calculate overall statistics
    const allEntries = records.flatMap(record => record.attendanceData)
    const totalRecords = allEntries.length
    const presentCount = allEntries.filter(entry => entry.status === 'present').length
    const absentCount = allEntries.filter(entry => entry.status === 'absent').length
    const lateCount = allEntries.filter(entry => entry.status === 'late').length
    const excusedCount = allEntries.filter(entry => entry.status === 'excused').length
    const attendanceRate = totalRecords > 0 ? (presentCount + lateCount) / totalRecords * 100 : 0

    const analytics: AttendanceAnalytics = {
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      attendanceRate: Math.round(attendanceRate * 100) / 100
    }

    // Add breakdown by groupBy option
    if (options.groupBy) {
      if (options.groupBy === 'student') {
        const studentStats = new Map()
        
        allEntries.forEach(entry => {
          const studentId = entry.studentId
          const studentName = entry.student.name
          
          if (!studentStats.has(studentId)) {
            studentStats.set(studentId, {
              id: studentId,
              name: studentName,
              presentCount: 0,
              absentCount: 0,
              lateCount: 0,
              excusedCount: 0
            })
          }
          
          const stats = studentStats.get(studentId)
          stats[`${entry.status}Count`]++
        })

        analytics.breakdown = Array.from(studentStats.values()).map(stats => ({
          ...stats,
          attendanceRate: Math.round(((stats.presentCount + stats.lateCount) / 
            (stats.presentCount + stats.absentCount + stats.lateCount + stats.excusedCount)) * 100 * 100) / 100
        }))
      } else if (options.groupBy === 'class') {
        const classStats = new Map()
        
        records.forEach(record => {
          const classId = record.classId
          const className = record.class.name
          
          if (!classStats.has(classId)) {
            classStats.set(classId, {
              id: classId,
              name: className,
              presentCount: 0,
              absentCount: 0,
              lateCount: 0,
              excusedCount: 0
            })
          }
          
          const stats = classStats.get(classId)
          record.attendanceData.forEach(entry => {
            stats[`${entry.status}Count`]++
          })
        })

        analytics.breakdown = Array.from(classStats.values()).map(stats => ({
          ...stats,
          attendanceRate: Math.round(((stats.presentCount + stats.lateCount) / 
            (stats.presentCount + stats.absentCount + stats.lateCount + stats.excusedCount)) * 100 * 100) / 100
        }))
      }
    }

    return analytics
  }
}

export default new AttendanceService()