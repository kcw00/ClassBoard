import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Validation schemas
const createNoteSchema = Joi.object({
  classId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Class ID must be a valid UUID',
      'any.required': 'Class ID is required',
    }),
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      'string.pattern.base': 'Date must be in YYYY-MM-DD format',
      'any.required': 'Date is required',
    }),
  content: Joi.string()
    .min(1)
    .max(5000)
    .required()
    .messages({
      'string.min': 'Content must be at least 1 character long',
      'string.max': 'Content cannot exceed 5000 characters',
      'any.required': 'Content is required',
    }),
  topics: Joi.array()
    .items(
      Joi.string()
        .min(1)
        .max(100)
        .messages({
          'string.min': 'Each topic must be at least 1 character long',
          'string.max': 'Each topic cannot exceed 100 characters',
        })
    )
    .optional()
    .messages({
      'array.base': 'Topics must be an array',
    }),
  homework: Joi.string()
    .max(2000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Homework cannot exceed 2000 characters',
    }),
  objectives: Joi.string()
    .max(2000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Objectives cannot exceed 2000 characters',
    }),
});

const updateNoteSchema = Joi.object({
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Date must be in YYYY-MM-DD format',
    }),
  content: Joi.string()
    .min(1)
    .max(5000)
    .optional()
    .messages({
      'string.min': 'Content must be at least 1 character long',
      'string.max': 'Content cannot exceed 5000 characters',
    }),
  topics: Joi.array()
    .items(
      Joi.string()
        .min(1)
        .max(100)
        .messages({
          'string.min': 'Each topic must be at least 1 character long',
          'string.max': 'Each topic cannot exceed 100 characters',
        })
    )
    .optional()
    .messages({
      'array.base': 'Topics must be an array',
    }),
  homework: Joi.string()
    .max(2000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Homework cannot exceed 2000 characters',
    }),
  objectives: Joi.string()
    .max(2000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Objectives cannot exceed 2000 characters',
    }),
});

const noteIdSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Note ID must be a valid UUID',
      'any.required': 'Note ID is required',
    }),
});

const getNotesQuerySchema = Joi.object({
  classId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'Class ID must be a valid UUID',
    }),
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Date must be in YYYY-MM-DD format',
    }),
  dateFrom: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Date from must be in YYYY-MM-DD format',
    }),
  dateTo: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Date to must be in YYYY-MM-DD format',
    }),
  topics: Joi.alternatives()
    .try(
      Joi.string(),
      Joi.array().items(Joi.string())
    )
    .optional()
    .messages({
      'alternatives.match': 'Topics must be a string or array of strings',
    }),
  search: Joi.string()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Search must be at least 1 character long',
      'string.max': 'Search cannot exceed 100 characters',
    }),
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1',
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),
});

// Validation middleware functions
export const validateCreateNoteRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = createNoteSchema.validate(req.body);
  if (error) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      })),
    });
    return;
  }
  next();
};

export const validateUpdateNoteRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { error: bodyError } = updateNoteSchema.validate(req.body);
  const { error: paramsError } = noteIdSchema.validate(req.params);

  if (bodyError || paramsError) {
    const errors = [];
    if (bodyError) {
      errors.push(...bodyError.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      })));
    }
    if (paramsError) {
      errors.push(...paramsError.details.map(detail => ({
        field: `params.${detail.path.join('.')}`,
        message: detail.message,
      })));
    }

    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors,
    });
    return;
  }
  next();
};

export const validateNoteIdParam = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = noteIdSchema.validate(req.params);
  if (error) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: `params.${detail.path.join('.')}`,
        message: detail.message,
      })),
    });
    return;
  }
  next();
};

export const validateGetNotesQuery = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = getNotesQuerySchema.validate(req.query);
  if (error) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: `query.${detail.path.join('.')}`,
        message: detail.message,
      })),
    });
    return;
  }
  next();
};