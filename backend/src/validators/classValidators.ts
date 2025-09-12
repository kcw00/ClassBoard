import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Validation schemas
const createClassSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Class name must be at least 2 characters long',
      'string.max': 'Class name cannot exceed 100 characters',
      'any.required': 'Class name is required',
    }),
  subject: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Subject must be at least 2 characters long',
      'string.max': 'Subject cannot exceed 50 characters',
      'any.required': 'Subject is required',
    }),
  description: Joi.string()
    .max(500)
    .required()
    .messages({
      'string.max': 'Description cannot exceed 500 characters',
      'any.required': 'Description is required',
    }),
  room: Joi.string()
    .min(1)
    .max(20)
    .required()
    .messages({
      'string.min': 'Room must be at least 1 character long',
      'string.max': 'Room cannot exceed 20 characters',
      'any.required': 'Room is required',
    }),
  capacity: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .required()
    .messages({
      'number.base': 'Capacity must be a number',
      'number.integer': 'Capacity must be a whole number',
      'number.min': 'Capacity must be at least 1',
      'number.max': 'Capacity cannot exceed 100',
      'any.required': 'Capacity is required',
    }),
  color: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .required()
    .messages({
      'string.pattern.base': 'Color must be a valid hex color code (e.g., #FF5733)',
      'any.required': 'Color is required',
    }),
});

const updateClassSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Class name must be at least 2 characters long',
      'string.max': 'Class name cannot exceed 100 characters',
    }),
  subject: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Subject must be at least 2 characters long',
      'string.max': 'Subject cannot exceed 50 characters',
    }),
  description: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters',
    }),
  room: Joi.string()
    .min(1)
    .max(20)
    .optional()
    .messages({
      'string.min': 'Room must be at least 1 character long',
      'string.max': 'Room cannot exceed 20 characters',
    }),
  capacity: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'number.base': 'Capacity must be a number',
      'number.integer': 'Capacity must be a whole number',
      'number.min': 'Capacity must be at least 1',
      'number.max': 'Capacity cannot exceed 100',
    }),
  color: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Color must be a valid hex color code (e.g., #FF5733)',
    }),
});

const enrollmentSchema = Joi.object({
  studentId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Student ID must be a valid UUID',
      'any.required': 'Student ID is required',
    }),
});

const classIdParamSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Class ID must be a valid UUID',
      'any.required': 'Class ID is required',
    }),
});

const studentIdParamSchema = Joi.object({
  studentId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Student ID must be a valid UUID',
      'any.required': 'Student ID is required',
    }),
});

const getClassesQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be a whole number',
      'number.min': 'Page must be at least 1',
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be a whole number',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),
  subject: Joi.string()
    .min(1)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Subject must be at least 1 character long',
      'string.max': 'Subject cannot exceed 50 characters',
    }),
  search: Joi.string()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Search term must be at least 1 character long',
      'string.max': 'Search term cannot exceed 100 characters',
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
export const validateCreateClassRequest = createValidator(createClassSchema);
export const validateUpdateClassRequest = createValidator(updateClassSchema);
export const validateEnrollmentRequest = createValidator(enrollmentSchema);
export const validateClassIdParam = createValidator(classIdParamSchema, 'params');
export const validateStudentIdParam = createValidator(studentIdParamSchema, 'params');
export const validateGetClassesQuery = createValidator(getClassesQuerySchema, 'query');

// Export schemas for testing
export {
  createClassSchema,
  updateClassSchema,
  enrollmentSchema,
  classIdParamSchema,
  studentIdParamSchema,
  getClassesQuerySchema,
};