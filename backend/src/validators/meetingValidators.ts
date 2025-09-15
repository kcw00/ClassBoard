import Joi from 'joi'

// Create meeting validation
export const createMeetingSchema = Joi.object({
  title: Joi.string().min(1).max(200).required().messages({
    'string.min': 'Title is required',
    'string.max': 'Title must be less than 200 characters'
  }),
  description: Joi.string().max(1000).allow('').optional().messages({
    'string.max': 'Description must be less than 1000 characters'
  }),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
    'string.pattern.base': 'Date must be in YYYY-MM-DD format'
  }),
  startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
    'string.pattern.base': 'Start time must be in HH:MM format'
  }),
  endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
    'string.pattern.base': 'End time must be in HH:MM format'
  }),
  participants: Joi.array().items(Joi.string()).min(1).required().messages({
    'array.min': 'At least one participant is required'
  }),
  participantType: Joi.string().valid('students', 'parents', 'teachers').required(),
  location: Joi.string().max(200).allow('').optional().messages({
    'string.max': 'Location must be less than 200 characters'
  }),
  meetingType: Joi.string().valid('in_person', 'virtual').required(),
  status: Joi.string().valid('scheduled', 'completed', 'cancelled').default('scheduled'),
  notes: Joi.string().max(1000).optional().messages({
    'string.max': 'Notes must be less than 1000 characters'
  })
}).custom((value, helpers) => {
  // Validate that end time is after start time
  const [startHour, startMin] = value.startTime.split(':').map(Number)
  const [endHour, endMin] = value.endTime.split(':').map(Number)
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  
  if (endMinutes <= startMinutes) {
    return helpers.error('custom.endTimeAfterStart')
  }
  
  return value
}).messages({
  'custom.endTimeAfterStart': 'End time must be after start time'
})

// Update meeting validation
export const updateMeetingSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional().messages({
    'string.min': 'Title is required',
    'string.max': 'Title must be less than 200 characters'
  }),
  description: Joi.string().max(1000).allow('').optional().messages({
    'string.max': 'Description must be less than 1000 characters'
  }),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
    'string.pattern.base': 'Date must be in YYYY-MM-DD format'
  }),
  startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().messages({
    'string.pattern.base': 'Start time must be in HH:MM format'
  }),
  endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().messages({
    'string.pattern.base': 'End time must be in HH:MM format'
  }),
  participants: Joi.array().items(Joi.string()).min(1).optional().messages({
    'array.min': 'At least one participant is required'
  }),
  participantType: Joi.string().valid('students', 'parents', 'teachers').optional(),
  location: Joi.string().max(200).allow('').optional().messages({
    'string.max': 'Location must be less than 200 characters'
  }),
  meetingType: Joi.string().valid('in_person', 'virtual').optional(),
  status: Joi.string().valid('scheduled', 'completed', 'cancelled').optional(),
  notes: Joi.string().max(1000).optional().messages({
    'string.max': 'Notes must be less than 1000 characters'
  })
}).custom((value, helpers) => {
  // Validate that end time is after start time if both are provided
  if (value.startTime && value.endTime) {
    const [startHour, startMin] = value.startTime.split(':').map(Number)
    const [endHour, endMin] = value.endTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    
    if (endMinutes <= startMinutes) {
      return helpers.error('custom.endTimeAfterStart')
    }
  }
  
  return value
}).messages({
  'custom.endTimeAfterStart': 'End time must be after start time'
})

// Query parameters for meetings
export const meetingQuerySchema = Joi.object({
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
    'string.pattern.base': 'Date must be in YYYY-MM-DD format'
  }),
  startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
    'string.pattern.base': 'Start date must be in YYYY-MM-DD format'
  }),
  endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
    'string.pattern.base': 'End date must be in YYYY-MM-DD format'
  }),
  meetingType: Joi.string().valid('in_person', 'virtual').optional(),
  status: Joi.string().valid('scheduled', 'completed', 'cancelled').optional(),
  participantType: Joi.string().valid('students', 'parents', 'teachers').optional(),
  participant: Joi.string().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional()
})