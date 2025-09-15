import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Validation schemas
const createStudentSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Student name must be at least 2 characters long',
      'string.max': 'Student name cannot exceed 100 characters',
      'any.required': 'Student name is required',
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  phone: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
      'any.required': 'Phone number is required',
    }),
  grade: Joi.string()
    .min(1)
    .max(20)
    .required()
    .messages({
      'string.min': 'Grade must be at least 1 character long',
      'string.max': 'Grade cannot exceed 20 characters',
      'any.required': 'Grade is required',
    }),
  parentContact: Joi.string()
    .min(2)
    .max(200)
    .required()
    .messages({
      'string.min': 'Parent contact must be at least 2 characters long',
      'string.max': 'Parent contact cannot exceed 200 characters',
      'any.required': 'Parent contact is required',
    }),
  enrollmentDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      'string.pattern.base': 'Enrollment date must be in YYYY-MM-DD format',
      'any.required': 'Enrollment date is required',
    }),
});

const updateStudentSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Student name must be at least 2 characters long',
      'string.max': 'Student name cannot exceed 100 characters',
    }),
  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Please provide a valid email address',
    }),
  phone: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
    }),
  grade: Joi.string()
    .min(1)
    .max(20)
    .optional()
    .messages({
      'string.min': 'Grade must be at least 1 character long',
      'string.max': 'Grade cannot exceed 20 characters',
    }),
  parentContact: Joi.string()
    .min(2)
    .max(200)
    .optional()
    .messages({
      'string.min': 'Parent contact must be at least 2 characters long',
      'string.max': 'Parent contact cannot exceed 200 characters',
    }),
  enrollmentDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Enrollment date must be in YYYY-MM-DD format',
    }),
});

const studentIdParamSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Student ID must be a valid UUID',
      'any.required': 'Student ID is required',
    }),
});

const getStudentsQuerySchema = Joi.object({
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
  grade: Joi.string()
    .min(1)
    .max(20)
    .optional()
    .messages({
      'string.min': 'Grade must be at least 1 character long',
      'string.max': 'Grade cannot exceed 20 characters',
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

const searchStudentsQuerySchema = Joi.object({
  q: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Search query must be at least 1 character long',
      'string.max': 'Search query cannot exceed 100 characters',
      'any.required': 'Search query is required',
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be a whole number',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 50',
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
export const validateCreateStudentRequest = createValidator(createStudentSchema);
export const validateUpdateStudentRequest = createValidator(updateStudentSchema);
export const validateStudentIdParam = createValidator(studentIdParamSchema, 'params');
export const validateGetStudentsQuery = createValidator(getStudentsQuerySchema, 'query');
export const validateSearchStudentsQuery = createValidator(searchStudentsQuerySchema, 'query');

// Export schemas for testing
export {
  createStudentSchema,
  updateStudentSchema,
  studentIdParamSchema,
  getStudentsQuerySchema,
  searchStudentsQuerySchema,
};