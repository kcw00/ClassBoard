import { Router, Request, Response } from 'express';
import multer from 'multer';
import { fileService } from '../services/fileService';
import { fileSecurityService } from '../services/fileSecurityService';
import { authenticateToken } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';
import { validateFileUploadSecurity } from '../middleware/validation';
import {
  validateFileUpload,
  validateFileId,
  validateEntityFiles,
  validateSignedUrl,
  validateFileMetadata,
} from '../validators/fileValidators';
import { FileEntityType } from '@prisma/client';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit (will be validated by service)
  },
});

/**
 * Upload a file
 * POST /api/files/upload
 */
router.post('/upload', uploadLimiter, authenticateToken, upload.single('file'), validateFileUploadSecurity, async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { entityType, entityId, isPublic } = req.body;
    const userId = req.user?.id;

    // Validate file metadata
    if (!file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE',
          message: 'No file provided',
        },
      });
    }

    const fileValidation = validateFileMetadata(file);
    if (!fileValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE',
          message: 'Invalid file',
          details: fileValidation.errors,
        },
      });
    }

    // Validate request body
    const { error } = validateFileUpload({ entityType, entityId, isPublic });
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
        },
      });
    }

    // Perform security scan on the file
    const securityResult = await fileSecurityService.scanFile(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    if (!securityResult.isSecure) {
      console.warn('File security scan failed:', {
        filename: file.originalname,
        threats: securityResult.threats,
        userId,
        timestamp: new Date().toISOString()
      });

      return res.status(400).json({
        success: false,
        error: {
          code: 'SECURITY_THREAT_DETECTED',
          message: 'File contains security threats and cannot be uploaded',
          details: securityResult.threats,
        },
      });
    }

    // Log successful security scan
    console.log('File security scan passed:', {
      filename: file.originalname,
      fileHash: securityResult.fileHash,
      userId,
      timestamp: new Date().toISOString()
    });

    // Upload file
    const uploadResult = await fileService.uploadFile({
      originalName: file.originalname,
      buffer: file.buffer,
      mimeType: file.mimetype,
      size: file.size,
      entityType: entityType as FileEntityType,
      entityId,
      uploadedBy: userId,
      isPublic: isPublic === 'true' || isPublic === true,
    });

    return res.status(201).json({
      success: true,
      data: uploadResult,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: error instanceof Error ? error.message : 'Failed to upload file',
      },
    });
  }
});

/**
 * Get file metadata
 * GET /api/files/:fileId
 */
router.get('/:fileId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;

    // Validate file ID
    const { error } = validateFileId({ fileId });
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
        },
      });
    }

    // Get file metadata
    const fileMetadata = await fileService.getFileMetadata(fileId);
    if (!fileMetadata) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File not found',
        },
      });
    }

    return res.json({
      success: true,
      data: fileMetadata,
    });
  } catch (error) {
    console.error('Get file metadata error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get file metadata',
      },
    });
  }
});

/**
 * Get signed URL for file access
 * GET /api/files/:fileId/signed-url
 */
router.get('/:fileId/signed-url', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const { expiresIn } = req.query;

    // Validate request
    const { error } = validateSignedUrl({ 
      fileId, 
      expiresIn: expiresIn ? parseInt(expiresIn as string) : undefined 
    });
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
        },
      });
    }

    // Generate signed URL
    const signedUrl = await fileService.getFileSignedUrl(
      fileId,
      expiresIn ? parseInt(expiresIn as string) : undefined
    );

    if (!signedUrl) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File not found',
        },
      });
    }

    return res.json({
      success: true,
      data: {
        signedUrl,
        expiresIn: expiresIn ? parseInt(expiresIn as string) : 3600,
      },
    });
  } catch (error) {
    console.error('Generate signed URL error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to generate signed URL',
      },
    });
  }
});

/**
 * Delete a file
 * DELETE /api/files/:fileId
 */
router.delete('/:fileId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;

    // Validate file ID
    const { error } = validateFileId({ fileId });
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
        },
      });
    }

    // Delete file
    const deleted = await fileService.deleteFile(fileId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File not found',
        },
      });
    }

    return res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete file error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to delete file',
      },
    });
  }
});

/**
 * Get files by entity
 * GET /api/files/entity/:entityType/:entityId
 */
router.get('/entity/:entityType/:entityId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;

    // Validate request
    const { error } = validateEntityFiles({ entityType, entityId });
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
        },
      });
    }

    // Get files
    const files = await fileService.getFilesByEntity(
      entityType as FileEntityType,
      entityId
    );

    return res.json({
      success: true,
      data: files,
    });
  } catch (error) {
    console.error('Get entity files error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get entity files',
      },
    });
  }
});

/**
 * Upload multiple files
 * POST /api/files/upload-multiple
 */
router.post('/upload-multiple', uploadLimiter, authenticateToken, upload.array('files', 10), validateFileUploadSecurity, async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const { entityType, entityId, isPublic } = req.body;
    const userId = req.user?.id;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILES',
          message: 'No files provided',
        },
      });
    }

    // Validate request body
    const { error } = validateFileUpload({ entityType, entityId, isPublic });
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
        },
      });
    }

    // Validate all files
    for (const file of files) {
      const fileValidation = validateFileMetadata(file);
      if (!fileValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILE',
            message: `Invalid file: ${file.originalname}`,
            details: fileValidation.errors,
          },
        });
      }

      // Perform security scan on each file
      const securityResult = await fileSecurityService.scanFile(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      if (!securityResult.isSecure) {
        console.warn('File security scan failed:', {
          filename: file.originalname,
          threats: securityResult.threats,
          userId,
          timestamp: new Date().toISOString()
        });

        return res.status(400).json({
          success: false,
          error: {
            code: 'SECURITY_THREAT_DETECTED',
            message: `File ${file.originalname} contains security threats and cannot be uploaded`,
            details: securityResult.threats,
          },
        });
      }
    }

    // Upload all files
    const uploadPromises = files.map(file =>
      fileService.uploadFile({
        originalName: file.originalname,
        buffer: file.buffer,
        mimeType: file.mimetype,
        size: file.size,
        entityType: entityType as FileEntityType,
        entityId,
        uploadedBy: userId,
        isPublic: isPublic === 'true' || isPublic === true,
      })
    );

    const uploadResults = await Promise.all(uploadPromises);

    return res.status(201).json({
      success: true,
      data: uploadResults,
      message: `${uploadResults.length} files uploaded successfully`,
    });
  } catch (error) {
    console.error('Multiple file upload error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: error instanceof Error ? error.message : 'Failed to upload files',
      },
    });
  }
});

export default router;