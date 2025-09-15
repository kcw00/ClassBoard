import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { TestType, SubmissionStatus } from '@prisma/client';

// Test validation schemas
const createTestSchema = Joi.object({
  classId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Class ID must be a valid UUID',
      'any.required': 'Class ID is required',
    }),
  title: Joi.string()
    .min(2)
    .max(200)
    .required()
    .messages({
      'string.min': 'Test title must be at least 2 characters long',
      'string.max': 'Test title cannot exceed 200 characters',
      'any.required': 'Test title is required',
    }),
  description: Joi.string()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Test description cannot exceed 1000 characters',
    }),
  testDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      'string.pattern.base': 'Test date must be in YYYY-MM-DD format',
      'any.required': 'Test date is required',
    }),
  totalPoints: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'number.base': 'Total points must be a number',
      'number.integer': 'Total points must be a whole number',
      'number.min': 'Total points must be at least 1',
      'number.max': 'Total points cannot exceed 1000',
      'any.required': 'Total points is required',
    }),
  testType: Joi.string()
    .valid(...Object.values(TestType))
    .required()
    .messages({
      'any.only': 'Test type must be one of: quiz, exam, assignment, project',
      'any.required': 'Test type is required',
    }),
  fileName: Joi.string()
    .max(255)
    .optional()
    .messages({
      'string.max': 'File name cannot exceed 255 characters',
    }),
  fileUrl: Joi.string()
    .uri()
    .max(500)
    .optional()
    .messages({
      'string.uri': 'File URL must be a valid URL',
      'string.max': 'File URL cannot exceed 500 characters',
    }),
});

const updateTestSchema = Joi.object({
  title: Joi.string()
    .min(2)
    .max(200)
    .optional()
    .messages({
      'string.min': 'Test title must be at least 2 characters long',
      'string.max': 'Test title cannot exceed 200 characters',
    }),
  description: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Test description cannot exceed 1000 characters',
    }),
  testDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Test date must be in YYYY-MM-DD format',
    }),
  totalPoints: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .optional()
    .messages({
      'number.base': 'Total points must be a number',
      'number.integer': 'Total points must be a whole number',
      'number.min': 'Total points must be at least 1',
      'number.max': 'Total points cannot exceed 1000',
    }),
  testType: Joi.string()
    .valid(...Object.values(TestType))
    .optional()
    .messages({
      'any.only': 'Test type must be one of: quiz, exam, assignment, project',
    }),
  fileName: Joi.string()
    .max(255)
    .optional()
    .allow(null)
    .messages({
      'string.max': 'File name cannot exceed 255 characters',
    }),
  fileUrl: Joi.string()
    .uri()
    .max(500)
    .optional()
    .allow(null)
    .messages({
      'string.uri': 'File URL must be a valid URL',
      'string.max': 'File URL cannot exceed 500 characters',
    }),
});

// Test result validation schemas
const createTestResultSchema = Joi.object({
  testId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Test ID must be a valid UUID',
      'any.required': 'Test ID is required',
    }),
  studentId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Student ID must be a valid UUID',
      'any.required': 'Student ID is required',
    }),
  score: Joi.number()
    .integer()
    .min(0)
    .max(1000)
    .required()
    .messages({
      'number.base': 'Score must be a number',
      'number.integer': 'Score must be a whole number',
      'number.min': 'Score cannot be negative',
      'number.max': 'Score cannot exceed 1000',
      'any.required': 'Score is required',
    }),
  maxScore: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'number.base': 'Max score must be a number',
      'number.integer': 'Max score must be a whole number',
      'number.min': 'Max score must be at least 1',
      'number.max': 'Max score cannot exceed 1000',
      'any.required': 'Max score is required',
    }),
  grade: Joi.string()
    .max(5)
    .optional()
    .messages({
      'string.max': 'Grade cannot exceed 5 characters',
    }),
  feedback: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Feedback cannot exceed 1000 characters',
    }),
  submittedDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Submitted date must be in YYYY-MM-DD format',
    }),
});

const updateTestResultSchema = Joi.object({
  score: Joi.number()
    .integer()
    .min(0)
    .max(1000)
    .optional()
    .messages({
      'number.base': 'Score must be a number',
      'number.integer': 'Score must be a whole number',
      'number.min': 'Score cannot be negative',
      'number.max': 'Score cannot exceed 1000',
    }),
  maxScore: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .optional()
    .messages({
      'number.base': 'Max score must be a number',
      'number.integer': 'Max score must be a whole number',
      'number.min': 'Max score must be at least 1',
      'number.max': 'Max score cannot exceed 1000',
    }),
  grade: Joi.string()
    .max(5)
    .optional()
    .messages({
      'string.max': 'Grade cannot exceed 5 characters',
    }),
  feedback: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Feedback cannot exceed 1000 characters',
    }),
  submittedDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Submitted date must be in YYYY-MM-DD format',
    }),
});

// Homework assignment validation schemas
const createHomeworkSchema = Joi.object({
  classId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Class ID must be a valid UUID',
      'any.required': 'Class ID is required',
    }),
  title: Joi.string()
    .min(2)
    .max(200)
    .required()
    .messages({
      'string.min': 'Homework title must be at least 2 characters long',
      'string.max': 'Homework title cannot exceed 200 characters',
      'any.required': 'Homework title is required',
    }),
  description: Joi.string()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Homework description cannot exceed 1000 characters',
    }),
  assignedDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      'string.pattern.base': 'Assigned date must be in YYYY-MM-DD format',
      'any.required': 'Assigned date is required',
    }),
  dueDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      'string.pattern.base': 'Due date must be in YYYY-MM-DD format',
      'any.required': 'Due date is required',
    }),
  totalPoints: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'number.base': 'Total points must be a number',
      'number.integer': 'Total points must be a whole number',
      'number.min': 'Total points must be at least 1',
      'number.max': 'Total points cannot exceed 1000',
      'any.required': 'Total points is required',
    }),
  instructions: Joi.string()
    .max(2000)
    .optional()
    .messages({
      'string.max': 'Instructions cannot exceed 2000 characters',
    }),
  resources: Joi.array()
    .items(Joi.string().max(500))
    .max(10)
    .optional()
    .messages({
      'array.max': 'Cannot have more than 10 resources',
      'string.max': 'Each resource cannot exceed 500 characters',
    }),
});

const updateHomeworkSchema = Joi.object({
  title: Joi.string()
    .min(2)
    .max(200)
    .optional()
    .messages({
      'string.min': 'Homework title must be at least 2 characters long',
      'string.max': 'Homework title cannot exceed 200 characters',
    }),
  description: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Homework description cannot exceed 1000 characters',
    }),
  assignedDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Assigned date must be in YYYY-MM-DD format',
    }),
  dueDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Due date must be in YYYY-MM-DD format',
    }),
  totalPoints: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .optional()
    .messages({
      'number.base': 'Total points must be a number',
      'number.integer': 'Total points must be a whole number',
      'number.min': 'Total points must be at least 1',
      'number.max': 'Total points cannot exceed 1000',
    }),
  instructions: Joi.string()
    .max(2000)
    .optional()
    .messages({
      'string.max': 'Instructions cannot exceed 2000 characters',
    }),
  resources: Joi.array()
    .items(Joi.string().max(500))
    .max(10)
    .optional()
    .messages({
      'array.max': 'Cannot have more than 10 resources',
      'string.max': 'Each resource cannot exceed 500 characters',
    }),
});

// Homework submission validation schemas
const createHomeworkSubmissionSchema = Joi.object({
  assignmentId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Assignment ID must be a valid UUID',
      'any.required': 'Assignment ID is required',
    }),
  studentId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Student ID must be a valid UUID',
      'any.required': 'Student ID is required',
    }),
  submittedDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Submitted date must be in YYYY-MM-DD format',
    }),
  submissionNotes: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Submission notes cannot exceed 1000 characters',
    }),
});

const updateHomeworkSubmissionSchema = Joi.object({
  submittedDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Submitted date must be in YYYY-MM-DD format',
    }),
  score: Joi.number()
    .integer()
    .min(0)
    .max(1000)
    .optional()
    .messages({
      'number.base': 'Score must be a number',
      'number.integer': 'Score must be a whole number',
      'number.min': 'Score cannot be negative',
      'number.max': 'Score cannot exceed 1000',
    }),
  grade: Joi.string()
    .max(5)
    .optional()
    .messages({
      'string.max': 'Grade cannot exceed 5 characters',
    }),
  feedback: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Feedback cannot exceed 1000 characters',
    }),
  status: Joi.string()
    .valid(...Object.values(SubmissionStatus))
    .optional()
    .messages({
      'any.only': 'Status must be one of: not_submitted, submitted, graded, late',
    }),
  submissionNotes: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Submission notes cannot exceed 1000 characters',
    }),
});

// Parameter validation schemas
const testIdParamSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Test ID must be a valid UUID',
      'any.required': 'Test ID is required',
    }),
});

const homeworkIdParamSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Homework ID must be a valid UUID',
      'any.required': 'Homework ID is required',
    }),
});

const assignmentIdParamSchema = Joi.object({
  assignmentId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Assignment ID must be a valid UUID',
      'any.required': 'Assignment ID is required',
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

const studentIdParamSchema = Joi.object({
  studentId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Student ID must be a valid UUID',
      'any.required': 'Student ID is required',
    }),
});

const testResultParamsSchema = Joi.object({
  testId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Test ID must be a valid UUID',
      'any.required': 'Test ID is required',
    }),
  studentId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Student ID must be a valid UUID',
      'any.required': 'Student ID is required',
    }),
});

const homeworkSubmissionParamsSchema = Joi.object({
  assignmentId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Assignment ID must be a valid UUID',
      'any.required': 'Assignment ID is required',
    }),
  studentId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Student ID must be a valid UUID',
      'any.required': 'Student ID is required',
    }),
});

// Query validation schemas
const getTestsQuerySchema = Joi.object({
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
  testType: Joi.string()
    .valid(...Object.values(TestType))
    .optional()
    .messages({
      'any.only': 'Test type must be one of: quiz, exam, assignment, project',
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

const getHomeworkQuerySchema = Joi.object({
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
  status: Joi.string()
    .valid(...Object.values(SubmissionStatus))
    .optional()
    .messages({
      'any.only': 'Status must be one of: not_submitted, submitted, graded, late',
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
export const validateCreateTestRequest = createValidator(createTestSchema);
export const validateUpdateTestRequest = createValidator(updateTestSchema);
export const validateCreateTestResultRequest = createValidator(createTestResultSchema);
export const validateUpdateTestResultRequest = createValidator(updateTestResultSchema);
export const validateCreateHomeworkRequest = createValidator(createHomeworkSchema);
export const validateUpdateHomeworkRequest = createValidator(updateHomeworkSchema);
export const validateCreateHomeworkSubmissionRequest = createValidator(createHomeworkSubmissionSchema);
export const validateUpdateHomeworkSubmissionRequest = createValidator(updateHomeworkSubmissionSchema);

export const validateTestIdParam = createValidator(testIdParamSchema, 'params');
export const validateHomeworkIdParam = createValidator(homeworkIdParamSchema, 'params');
export const validateAssignmentIdParam = createValidator(assignmentIdParamSchema, 'params');
export const validateClassIdParam = createValidator(classIdParamSchema, 'params');
export const validateStudentIdParam = createValidator(studentIdParamSchema, 'params');
export const validateTestResultParams = createValidator(testResultParamsSchema, 'params');
export const validateHomeworkSubmissionParams = createValidator(homeworkSubmissionParamsSchema, 'params');

export const validateGetTestsQuery = createValidator(getTestsQuerySchema, 'query');
export const validateGetHomeworkQuery = createValidator(getHomeworkQuerySchema, 'query');

// Export schemas for testing
export {
  createTestSchema,
  updateTestSchema,
  createTestResultSchema,
  updateTestResultSchema,
  createHomeworkSchema,
  updateHomeworkSchema,
  createHomeworkSubmissionSchema,
  updateHomeworkSubmissionSchema,
  testIdParamSchema,
  homeworkIdParamSchema,
  assignmentIdParamSchema,
  classIdParamSchema,
  studentIdParamSchema,
  testResultParamsSchema,
  homeworkSubmissionParamsSchema,
  getTestsQuerySchema,
  getHomeworkQuerySchema,
};