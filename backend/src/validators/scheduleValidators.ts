import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Time format validation (HH:MM)
const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

// Date format validation (YYYY-MM-DD)
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

// Validation schemas
const createScheduleSchema = Joi.object({
  classId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Class ID must be a valid UUID',
      'any.required': 'Class ID is required',
    }),
  dayOfWeek: Joi.number()
    .integer()
    .min(0)
    .max(6)
    .required()
    .messages({
      'number.base': 'Day of week must be a number',
      'number.integer': 'Day of week must be a whole number',
      'number.min': 'Day of week must be between 0 (Sunday) and 6 (Saturday)',
      'number.max': 'Day of week must be between 0 (Sunday) and 6 (Saturday)',
      'any.required': 'Day of week is required',
    }),
  startTime: Joi.string()
    .pattern(timePattern)
    .required()
    .messages({
      'string.pattern.base': 'Start time must be in HH:MM format (e.g., 09:30)',
      'any.required': 'Start time is required',
    }),
  endTime: Joi.string()
    .pattern(timePattern)
    .required()
    .messages({
      'string.pattern.base': 'End time must be in HH:MM format (e.g., 10:30)',
      'any.required': 'End time is required',
    }),
}).custom((value, helpers) => {
  // Validate that end time is after start time
  const [startHours, startMinutes] = value.startTime.split(':').map(Number);
  const [endHours, endMinutes] = value.endTime.split(':').map(Number);
  
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  
  if (endTotalMinutes <= startTotalMinutes) {
    return helpers.error('custom.endTimeAfterStart');
  }
  
  return value;
}, 'Time validation').messages({
  'custom.endTimeAfterStart': 'End time must be after start time',
});

const updateScheduleSchema = Joi.object({
  dayOfWeek: Joi.number()
    .integer()
    .min(0)
    .max(6)
    .optional()
    .messages({
      'number.base': 'Day of week must be a number',
      'number.integer': 'Day of week must be a whole number',
      'number.min': 'Day of week must be between 0 (Sunday) and 6 (Saturday)',
      'number.max': 'Day of week must be between 0 (Sunday) and 6 (Saturday)',
    }),
  startTime: Joi.string()
    .pattern(timePattern)
    .optional()
    .messages({
      'string.pattern.base': 'Start time must be in HH:MM format (e.g., 09:30)',
    }),
  endTime: Joi.string()
    .pattern(timePattern)
    .optional()
    .messages({
      'string.pattern.base': 'End time must be in HH:MM format (e.g., 10:30)',
    }),
}).custom((value, helpers) => {
  // Validate that end time is after start time (only if both are provided)
  if (value.startTime && value.endTime) {
    const [startHours, startMinutes] = value.startTime.split(':').map(Number);
    const [endHours, endMinutes] = value.endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    if (endTotalMinutes <= startTotalMinutes) {
      return helpers.error('custom.endTimeAfterStart');
    }
  }
  
  return value;
}, 'Time validation').messages({
  'custom.endTimeAfterStart': 'End time must be after start time',
});

const createScheduleExceptionSchema = Joi.object({
  scheduleId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Schedule ID must be a valid UUID',
      'any.required': 'Schedule ID is required',
    }),
  date: Joi.string()
    .pattern(datePattern)
    .required()
    .custom((value, helpers) => {
      // Validate that the date is not in the past
      const inputDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (inputDate < today) {
        return helpers.error('custom.dateNotInPast');
      }
      
      return value;
    })
    .messages({
      'string.pattern.base': 'Date must be in YYYY-MM-DD format',
      'any.required': 'Date is required',
      'custom.dateNotInPast': 'Date cannot be in the past',
    }),
  startTime: Joi.string()
    .pattern(timePattern)
    .required()
    .messages({
      'string.pattern.base': 'Start time must be in HH:MM format (e.g., 09:30)',
      'any.required': 'Start time is required',
    }),
  endTime: Joi.string()
    .pattern(timePattern)
    .required()
    .messages({
      'string.pattern.base': 'End time must be in HH:MM format (e.g., 10:30)',
      'any.required': 'End time is required',
    }),
  cancelled: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Cancelled must be a boolean value',
    }),
}).custom((value, helpers) => {
  // Validate that end time is after start time
  const [startHours, startMinutes] = value.startTime.split(':').map(Number);
  const [endHours, endMinutes] = value.endTime.split(':').map(Number);
  
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  
  if (endTotalMinutes <= startTotalMinutes) {
    return helpers.error('custom.endTimeAfterStart');
  }
  
  return value;
}, 'Time validation').messages({
  'custom.endTimeAfterStart': 'End time must be after start time',
});

const updateScheduleExceptionSchema = Joi.object({
  date: Joi.string()
    .pattern(datePattern)
    .optional()
    .custom((value, helpers) => {
      // Validate that the date is not in the past
      const inputDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (inputDate < today) {
        return helpers.error('custom.dateNotInPast');
      }
      
      return value;
    })
    .messages({
      'string.pattern.base': 'Date must be in YYYY-MM-DD format',
      'custom.dateNotInPast': 'Date cannot be in the past',
    }),
  startTime: Joi.string()
    .pattern(timePattern)
    .optional()
    .messages({
      'string.pattern.base': 'Start time must be in HH:MM format (e.g., 09:30)',
    }),
  endTime: Joi.string()
    .pattern(timePattern)
    .optional()
    .messages({
      'string.pattern.base': 'End time must be in HH:MM format (e.g., 10:30)',
    }),
  cancelled: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Cancelled must be a boolean value',
    }),
}).custom((value, helpers) => {
  // Validate that end time is after start time (only if both are provided)
  if (value.startTime && value.endTime) {
    const [startHours, startMinutes] = value.startTime.split(':').map(Number);
    const [endHours, endMinutes] = value.endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    if (endTotalMinutes <= startTotalMinutes) {
      return helpers.error('custom.endTimeAfterStart');
    }
  }
  
  return value;
}, 'Time validation').messages({
  'custom.endTimeAfterStart': 'End time must be after start time',
});

const scheduleIdParamSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Schedule ID must be a valid UUID',
      'any.required': 'Schedule ID is required',
    }),
});

const classIdParamSchema = Joi.object({
  classId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Class ID must be a valid UUID',
      'any.required': 'Class ID is required',
    }),
});

const exceptionIdParamSchema = Joi.object({
  exceptionId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Exception ID must be a valid UUID',
      'any.required': 'Exception ID is required',
    }),
});

// Validation middleware factory
const createValidator = (schema: Joi.ObjectSchema, target: 'body' | 'params' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    let dataToValidate;
    switch (target) {
      case 'body':
        dataToValidate = req.body;
        break;
      case 'params':
        dataToValidate = req.params;
        break;
      case 'query':
        dataToValidate = req.query;
        break;
      default:
        dataToValidate = req.body;
    }

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: validationErrors,
        },
      });
      return;
    }

    // Replace the target with validated and sanitized data
    switch (target) {
      case 'body':
        req.body = value;
        break;
      case 'params':
        req.params = { ...req.params, ...value };
        break;
      case 'query':
        req.query = { ...req.query, ...value };
        break;
    }
    next();
  };
};

// Export validation middleware
export const validateCreateScheduleRequest = createValidator(createScheduleSchema);
export const validateUpdateScheduleRequest = createValidator(updateScheduleSchema);
export const validateCreateScheduleExceptionRequest = createValidator(createScheduleExceptionSchema);
export const validateUpdateScheduleExceptionRequest = createValidator(updateScheduleExceptionSchema);
export const validateScheduleIdParam = createValidator(scheduleIdParamSchema, 'params');
export const validateClassIdParam = createValidator(classIdParamSchema, 'params');
export const validateExceptionIdParam = createValidator(exceptionIdParamSchema, 'params');

// Export schemas for testing
export {
  createScheduleSchema,
  updateScheduleSchema,
  createScheduleExceptionSchema,
  updateScheduleExceptionSchema,
  scheduleIdParamSchema,
  classIdParamSchema,
  exceptionIdParamSchema,
};