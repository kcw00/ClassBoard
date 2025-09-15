import Joi from 'joi'

// Attendance entry validation
export const attendanceEntrySchema = Joi.object({
  studentId: Joi.string().uuid().required().messages({
    'string.guid': 'Student ID must be a valid UUID'
  }),
  status: Joi.string().valid('present', 'absent', 'late', 'excused').required(),
  notes: Joi.string().optional()
})

// Create attendance record validation
export const createAttendanceRecordSchema = Joi.object({
  classId: Joi.string().uuid().required().messages({
    'string.guid': 'Class ID must be a valid UUID'
  }),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
    'string.pattern.base': 'Date must be in YYYY-MM-DD format'
  }),
  attendanceData: Joi.array().items(attendanceEntrySchema).min(1).required().messages({
    'array.min': 'At least one attendance entry is required'
  })
})

// Update attendance record validation
export const updateAttendanceRecordSchema = Joi.object({
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
    'string.pattern.base': 'Date must be in YYYY-MM-DD format'
  }),
  attendanceData: Joi.array().items(attendanceEntrySchema).min(1).optional().messages({
    'array.min': 'At least one attendance entry is required'
  })
})

// Query parameters for attendance records
export const attendanceQuerySchema = Joi.object({
  classId: Joi.string().uuid().optional().messages({
    'string.guid': 'Class ID must be a valid UUID'
  }),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
    'string.pattern.base': 'Date must be in YYYY-MM-DD format'
  }),
  startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
    'string.pattern.base': 'Start date must be in YYYY-MM-DD format'
  }),
  endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
    'string.pattern.base': 'End date must be in YYYY-MM-DD format'
  }),
  studentId: Joi.string().uuid().optional().messages({
    'string.guid': 'Student ID must be a valid UUID'
  }),
  status: Joi.string().valid('present', 'absent', 'late', 'excused').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional()
})

// Attendance analytics query validation
export const attendanceAnalyticsSchema = Joi.object({
  classId: Joi.string().uuid().optional().messages({
    'string.guid': 'Class ID must be a valid UUID'
  }),
  studentId: Joi.string().uuid().optional().messages({
    'string.guid': 'Student ID must be a valid UUID'
  }),
  startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
    'string.pattern.base': 'Start date must be in YYYY-MM-DD format'
  }),
  endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
    'string.pattern.base': 'End date must be in YYYY-MM-DD format'
  }),
  groupBy: Joi.string().valid('student', 'class', 'date').optional()
})