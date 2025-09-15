import { Router } from 'express'
import attendanceService from '../services/attendanceService'
import { authenticateToken } from '../middleware/auth'
import { 
  createAttendanceRecordSchema, 
  updateAttendanceRecordSchema, 
  attendanceQuerySchema,
  attendanceAnalyticsSchema
} from '../validators/attendanceValidators'
import { ValidationError } from '../utils/errors'

const router = Router()

// Apply authentication middleware to all routes
router.use(authenticateToken)

// Create attendance record
router.post('/', async (req, res, next) => {
  try {
    const { error, value: validatedData } = createAttendanceRecordSchema.validate(req.body)
    if (error) {
      throw new ValidationError(error.details[0].message)
    }
    
    const attendanceRecord = await attendanceService.createAttendanceRecord(validatedData)
    
    res.status(201).json({
      success: true,
      data: attendanceRecord,
      message: 'Attendance record created successfully'
    })
  } catch (error) {
    next(error)
  }
})

// Get attendance records with filtering and pagination
router.get('/', async (req, res, next) => {
  try {
    const { error, value: validatedQuery } = attendanceQuerySchema.validate(req.query)
    if (error) {
      throw new ValidationError(error.details[0].message)
    }
    
    const result = await attendanceService.getAttendanceRecords(validatedQuery)
    
    res.json({
      success: true,
      data: result.records,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    })
  } catch (error) {
    next(error)
  }
})

// Get attendance record by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new ValidationError('Invalid attendance record ID format')
    }
    
    const attendanceRecord = await attendanceService.getAttendanceRecordById(id)
    
    res.json({
      success: true,
      data: attendanceRecord
    })
  } catch (error) {
    next(error)
  }
})

// Update attendance record
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new ValidationError('Invalid attendance record ID format')
    }
    
    const { error, value: validatedData } = updateAttendanceRecordSchema.validate(req.body)
    if (error) {
      throw new ValidationError(error.details[0].message)
    }
    
    const attendanceRecord = await attendanceService.updateAttendanceRecord(id, validatedData)
    
    res.json({
      success: true,
      data: attendanceRecord,
      message: 'Attendance record updated successfully'
    })
  } catch (error) {
    next(error)
  }
})

// Delete attendance record
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new ValidationError('Invalid attendance record ID format')
    }
    
    await attendanceService.deleteAttendanceRecord(id)
    
    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    })
  } catch (error) {
    next(error)
  }
})

// Get attendance analytics
router.get('/analytics/summary', async (req, res, next) => {
  try {
    const { error, value: validatedQuery } = attendanceAnalyticsSchema.validate(req.query)
    if (error) {
      throw new ValidationError(error.details[0].message)
    }
    
    const analytics = await attendanceService.getAttendanceAnalytics(validatedQuery)
    
    res.json({
      success: true,
      data: analytics
    })
  } catch (error) {
    next(error)
  }
})

// Get attendance records for a specific class
router.get('/class/:classId', async (req, res, next) => {
  try {
    const { classId } = req.params
    
    if (!classId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new ValidationError('Invalid class ID format')
    }
    
    const { error, value: validatedQuery } = attendanceQuerySchema.validate(req.query)
    if (error) {
      throw new ValidationError(error.details[0].message)
    }
    
    const result = await attendanceService.getAttendanceRecords({
      ...validatedQuery,
      classId
    })
    
    res.json({
      success: true,
      data: result.records,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    })
  } catch (error) {
    next(error)
  }
})

// Get attendance records for a specific student
router.get('/student/:studentId', async (req, res, next) => {
  try {
    const { studentId } = req.params
    
    if (!studentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new ValidationError('Invalid student ID format')
    }
    
    const { error, value: validatedQuery } = attendanceQuerySchema.validate(req.query)
    if (error) {
      throw new ValidationError(error.details[0].message)
    }
    
    const result = await attendanceService.getAttendanceRecords({
      ...validatedQuery,
      studentId
    })
    
    res.json({
      success: true,
      data: result.records,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router