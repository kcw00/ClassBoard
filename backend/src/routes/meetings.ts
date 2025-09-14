import { Router } from 'express'
import meetingService from '../services/meetingService'
import { authenticateToken } from '../middleware/auth'
import { 
  createMeetingSchema, 
  updateMeetingSchema, 
  meetingQuerySchema
} from '../validators/meetingValidators'
import { ValidationError } from '../utils/errors'

const router = Router()

// Apply authentication middleware to all routes
router.use(authenticateToken)

// Create meeting
router.post('/', async (req, res, next) => {
  try {
    const { error, value: validatedData } = createMeetingSchema.validate(req.body)
    if (error) {
      throw new ValidationError(error.details[0].message)
    }
    
    const meeting = await meetingService.createMeeting(validatedData)
    
    res.status(201).json({
      success: true,
      data: meeting,
      message: 'Meeting created successfully'
    })
  } catch (error) {
    next(error)
  }
})

// Get meetings with filtering and pagination
router.get('/', async (req, res, next) => {
  try {
    const { error, value: validatedQuery } = meetingQuerySchema.validate(req.query)
    if (error) {
      throw new ValidationError(error.details[0].message)
    }
    
    const result = await meetingService.getMeetings(validatedQuery)
    
    res.json({
      success: true,
      data: result.meetings,
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

// Get meeting by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new ValidationError('Invalid meeting ID format')
    }
    
    const meeting = await meetingService.getMeetingById(id)
    
    res.json({
      success: true,
      data: meeting
    })
  } catch (error) {
    next(error)
  }
})

// Update meeting
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new ValidationError('Invalid meeting ID format')
    }
    
    const { error, value: validatedData } = updateMeetingSchema.validate(req.body)
    if (error) {
      throw new ValidationError(error.details[0].message)
    }
    
    const meeting = await meetingService.updateMeeting(id, validatedData)
    
    res.json({
      success: true,
      data: meeting,
      message: 'Meeting updated successfully'
    })
  } catch (error) {
    next(error)
  }
})

// Delete meeting
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new ValidationError('Invalid meeting ID format')
    }
    
    await meetingService.deleteMeeting(id)
    
    res.json({
      success: true,
      message: 'Meeting deleted successfully'
    })
  } catch (error) {
    next(error)
  }
})

// Get meetings by participant
router.get('/participant/:participantId', async (req, res, next) => {
  try {
    const { participantId } = req.params
    const { error, value: validatedQuery } = meetingQuerySchema.validate(req.query)
    if (error) {
      throw new ValidationError(error.details[0].message)
    }
    
    const result = await meetingService.getMeetingsByParticipant(participantId, validatedQuery)
    
    res.json({
      success: true,
      data: result.meetings,
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

// Get meetings by date range
router.get('/range/:startDate/:endDate', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.params
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      throw new ValidationError('Dates must be in YYYY-MM-DD format')
    }
    
    const { error, value: validatedQuery } = meetingQuerySchema.validate(req.query)
    if (error) {
      throw new ValidationError(error.details[0].message)
    }
    
    const meetings = await meetingService.getMeetingsByDateRange(startDate, endDate, validatedQuery)
    
    res.json({
      success: true,
      data: meetings
    })
  } catch (error) {
    next(error)
  }
})

// Cancel meeting
router.patch('/:id/cancel', async (req, res, next) => {
  try {
    const { id } = req.params
    const { reason } = req.body
    
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new ValidationError('Invalid meeting ID format')
    }
    
    const meeting = await meetingService.cancelMeeting(id, reason)
    
    res.json({
      success: true,
      data: meeting,
      message: 'Meeting cancelled successfully'
    })
  } catch (error) {
    next(error)
  }
})

// Complete meeting
router.patch('/:id/complete', async (req, res, next) => {
  try {
    const { id } = req.params
    const { notes } = req.body
    
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new ValidationError('Invalid meeting ID format')
    }
    
    const meeting = await meetingService.completeMeeting(id, notes)
    
    res.json({
      success: true,
      data: meeting,
      message: 'Meeting completed successfully'
    })
  } catch (error) {
    next(error)
  }
})

export default router