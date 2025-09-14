import Joi from 'joi';
import { FileEntityType } from '@prisma/client';

export const fileUploadSchema = Joi.object({
  entityType: Joi.string()
    .valid(...Object.values(FileEntityType))
    .required()
    .messages({
      'any.required': 'Entity type is required',
      'any.only': 'Invalid entity type',
    }),
  entityId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.guid': 'Entity ID must be a valid UUID',
    }),
  isPublic: Joi.boolean()
    .optional()
    .default(false),
});

export const fileIdSchema = Joi.object({
  fileId: Joi.string()
    .uuid()
    .required()
    .messages({
      'any.required': 'File ID is required',
      'string.guid': 'File ID must be a valid UUID',
    }),
});

export const entityFilesSchema = Joi.object({
  entityType: Joi.string()
    .valid(...Object.values(FileEntityType))
    .required()
    .messages({
      'any.required': 'Entity type is required',
      'any.only': 'Invalid entity type',
    }),
  entityId: Joi.string()
    .uuid()
    .required()
    .messages({
      'any.required': 'Entity ID is required',
      'string.guid': 'Entity ID must be a valid UUID',
    }),
});

export const signedUrlSchema = Joi.object({
  fileId: Joi.string()
    .uuid()
    .required()
    .messages({
      'any.required': 'File ID is required',
      'string.guid': 'File ID must be a valid UUID',
    }),
  expiresIn: Joi.number()
    .integer()
    .min(60) // Minimum 1 minute
    .max(604800) // Maximum 7 days
    .optional()
    .messages({
      'number.base': 'Expires in must be a number',
      'number.integer': 'Expires in must be an integer',
      'number.min': 'Expires in must be at least 60 seconds',
      'number.max': 'Expires in must be at most 604800 seconds (7 days)',
    }),
});

/**
 * Validate file upload request
 */
export function validateFileUpload(data: any) {
  return fileUploadSchema.validate(data);
}

/**
 * Validate file ID parameter
 */
export function validateFileId(data: any) {
  return fileIdSchema.validate(data);
}

/**
 * Validate entity files request
 */
export function validateEntityFiles(data: any) {
  return entityFilesSchema.validate(data);
}

/**
 * Validate signed URL request
 */
export function validateSignedUrl(data: any) {
  return signedUrlSchema.validate(data);
}

/**
 * Validate file metadata for upload
 */
export function validateFileMetadata(file: Express.Multer.File) {
  const errors: string[] = [];

  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors };
  }

  if (!file.originalname || file.originalname.trim().length === 0) {
    errors.push('File name is required');
  }

  if (!file.mimetype) {
    errors.push('File MIME type is required');
  }

  if (!file.buffer || file.buffer.length === 0) {
    errors.push('File content is required');
  }

  if (file.size === 0) {
    errors.push('File cannot be empty');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if file type is an image
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Check if file type is a document
 */
export function isDocumentFile(mimeType: string): boolean {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ];
  
  return documentTypes.includes(mimeType);
}

/**
 * Get file category based on MIME type
 */
export function getFileCategory(mimeType: string): string {
  if (isImageFile(mimeType)) {
    return 'image';
  }
  
  if (isDocumentFile(mimeType)) {
    return 'document';
  }
  
  if (mimeType.startsWith('video/')) {
    return 'video';
  }
  
  if (mimeType.startsWith('audio/')) {
    return 'audio';
  }
  
  return 'other';
}