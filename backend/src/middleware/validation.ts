import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';
import { securityAuditService, SecurityEventType } from '../services/securityAuditService';

export interface ValidationError extends Error {
  statusCode: number;
  code: string;
  details: any;
  isOperational: boolean;
}

/**
 * Create validation middleware for request schemas
 */
export function validateRequest(schema: {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body);
      if (error) {
        errors.push(...error.details.map(detail => detail.message));
      }
    }

    // Validate request parameters
    if (schema.params) {
      const { error } = schema.params.validate(req.params);
      if (error) {
        errors.push(...error.details.map(detail => detail.message));
      }
    }

    // Validate query parameters
    if (schema.query) {
      const { error } = schema.query.validate(req.query);
      if (error) {
        errors.push(...error.details.map(detail => detail.message));
      }
    }

    if (errors.length > 0) {
      const validationError: ValidationError = new Error('Validation failed') as ValidationError;
      validationError.statusCode = 400;
      validationError.code = 'VALIDATION_ERROR';
      validationError.details = errors;
      validationError.isOperational = true;
      return next(validationError);
    }

    next();
  };
}

/**
 * Sanitize input data to prevent XSS attacks
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  next();
}

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Sanitize string input
 */
function sanitizeString(input: string): string {
  // Remove HTML tags and potentially dangerous content
  let sanitized = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });

  // Escape special characters
  sanitized = validator.escape(sanitized);

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
}

/**
 * Validate and sanitize email addresses
 */
export function validateEmail(email: string): boolean {
  return validator.isEmail(email) && email.length <= 254;
}

/**
 * Validate and sanitize phone numbers
 */
export function validatePhone(phone: string): boolean {
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): boolean {
  return validator.isUUID(uuid, 4);
}

/**
 * Validate date format
 */
export function validateDate(date: string): boolean {
  return validator.isISO8601(date);
}

/**
 * Validate URL format
 */
export function validateURL(url: string): boolean {
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true,
    allow_underscores: false,
    allow_trailing_dot: false,
    allow_protocol_relative_urls: false
  });
}

/**
 * Prevent SQL injection by validating input patterns
 */
export function preventSQLInjection(req: Request, res: Response, next: NextFunction) {
  const sqlInjectionPatterns = [
    // SQL Keywords in dangerous context (not just the word alone)
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\s+(FROM|INTO|SET|WHERE|TABLE|VALUES)\b)/gi,
    // Dangerous patterns - semicolon followed by SQL keywords
    /(;)\s*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|UNION)/gi,
    // SQL injection with quotes
    /('|(\\')).*?(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)/gi,
    // SQL comment injection patterns
    /(\/\*.*?\*\/|--\s|#.*$)/gmi,
    // URL encoded SQL injection patterns
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\%3B)|(;))/gi,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
    /((\%27)|(\'))union/gi
  ];

  const checkForSQLInjection = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return sqlInjectionPatterns.some(pattern => pattern.test(obj));
    }

    if (Array.isArray(obj)) {
      return obj.some(item => checkForSQLInjection(item));
    }

    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(value => checkForSQLInjection(value));
    }

    return false;
  };

  // Check request body, params, and query for SQL injection patterns
  if (checkForSQLInjection(req.body) || 
      checkForSQLInjection(req.params) || 
      checkForSQLInjection(req.query)) {
    
    // Log security event
    securityAuditService.logMaliciousInput(req, 'SQL_INJECTION', 'SQL injection patterns detected');
    
    const error: ValidationError = new Error('Potentially malicious input detected') as ValidationError;
    error.statusCode = 400;
    error.code = 'MALICIOUS_INPUT';
    error.details = 'Request contains patterns that may indicate SQL injection attempt';
    error.isOperational = true;
    return next(error);
  }

  next();
}

/**
 * Validate file upload security
 */
export function validateFileUploadSecurity(req: Request, res: Response, next: NextFunction) {
  if (!req.file && !req.files) {
    return next();
  }

  const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];

  for (const file of files) {
    if (!file) continue;

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      const error: ValidationError = new Error('File size exceeds limit') as ValidationError;
      error.statusCode = 400;
      error.code = 'FILE_TOO_LARGE';
      error.details = `File size ${file.size} exceeds maximum allowed size of ${maxSize} bytes`;
      error.isOperational = true;
      return next(error);
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      const error: ValidationError = new Error('Invalid file type') as ValidationError;
      error.statusCode = 400;
      error.code = 'INVALID_FILE_TYPE';
      error.details = `File type ${file.mimetype} is not allowed`;
      error.isOperational = true;
      return next(error);
    }

    // Validate file name
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar', '.php', '.asp', '.jsp'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (dangerousExtensions.includes(fileExtension)) {
      const error: ValidationError = new Error('Dangerous file extension') as ValidationError;
      error.statusCode = 400;
      error.code = 'DANGEROUS_FILE_EXTENSION';
      error.details = `File extension ${fileExtension} is not allowed`;
      error.isOperational = true;
      return next(error);
    }

    // Check for null bytes in filename (path traversal prevention)
    if (file.originalname.includes('\0')) {
      const error: ValidationError = new Error('Invalid file name') as ValidationError;
      error.statusCode = 400;
      error.code = 'INVALID_FILE_NAME';
      error.details = 'File name contains invalid characters';
      error.isOperational = true;
      return next(error);
    }
  }

  next();
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  uuid: Joi.string().uuid({ version: 'uuidv4' }).required(),
  email: Joi.string().email().max(254).required(),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
  date: Joi.date().iso().required(),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc')
  })
};