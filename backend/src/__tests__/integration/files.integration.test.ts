import request from 'supertest';
import express from 'express';
import { FileEntityType } from '@prisma/client';
import fileRoutes from '../../routes/files';

// Mock the file service
jest.mock('../../services/fileService', () => ({
  fileService: {
    uploadFile: jest.fn(),
    getFileMetadata: jest.fn(),
    getFileSignedUrl: jest.fn(),
    deleteFile: jest.fn(),
    getFilesByEntity: jest.fn(),
  },
}));

// Mock auth middleware to simulate authenticated user
jest.mock('../../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: 'user-123', email: 'test@example.com' };
    next();
  },
}));

describe('File API Integration Tests', () => {
  let app: express.Application;
  let mockFileService: any;

  // Valid UUIDs for testing
  const validFileId = '550e8400-e29b-41d4-a716-446655440000';
  const validEntityId = '550e8400-e29b-41d4-a716-446655440001';

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/files', fileRoutes);
    
    // Get the mocked file service
    const { fileService } = require('../../services/fileService');
    mockFileService = fileService;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/files/upload', () => {
    it('should upload file successfully', async () => {
      const mockUploadResult = {
        id: 'file-123',
        fileName: 'test-file.pdf',
        s3Key: 'test/2024-01-01/test-file.pdf',
        cloudFrontUrl: 'https://cdn.example.com/test/2024-01-01/test-file.pdf',
        signedUrl: 'https://signed-url.example.com',
      };

      mockFileService.uploadFile.mockResolvedValueOnce(mockUploadResult);

      const response = await request(app)
        .post('/api/files/upload')
        .attach('file', Buffer.from('test file content'), 'test.pdf')
        .field('entityType', 'test')
        .field('entityId', validEntityId)
        .field('isPublic', 'false');

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: mockUploadResult,
        message: 'File uploaded successfully',
      });

      expect(mockFileService.uploadFile).toHaveBeenCalledWith({
        originalName: 'test.pdf',
        buffer: expect.any(Buffer),
        mimeType: 'application/pdf',
        size: expect.any(Number),
        entityType: 'test',
        entityId: validEntityId,
        uploadedBy: 'user-123',
        isPublic: false,
      });
    });

    it('should return 400 when no file is provided', async () => {
      const response = await request(app)
        .post('/api/files/upload')
        .field('entityType', 'test')
        .field('entityId', 'test-entity-123');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_FILE');
    });

    it('should return 400 when entityType is invalid', async () => {
      const response = await request(app)
        .post('/api/files/upload')
        .attach('file', Buffer.from('test content'), 'test.pdf')
        .field('entityType', 'invalid_type')
        .field('entityId', 'test-entity-123');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle upload service errors', async () => {
      mockFileService.uploadFile.mockRejectedValueOnce(new Error('S3 upload failed'));

      const response = await request(app)
        .post('/api/files/upload')
        .attach('file', Buffer.from('test content'), 'test.pdf')
        .field('entityType', 'test')
        .field('entityId', validEntityId);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UPLOAD_ERROR');
    });
  });

  describe('GET /api/files/:fileId', () => {
    it('should return file metadata', async () => {
      const mockFileMetadata = {
        id: 'file-123',
        originalName: 'test.pdf',
        fileName: 'generated-name.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        entityType: FileEntityType.test,
        entityId: 'test-entity-123',
        isPublic: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockFileService.getFileMetadata.mockResolvedValueOnce(mockFileMetadata);

      const response = await request(app)
        .get(`/api/files/${validFileId}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          ...mockFileMetadata,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      });

      expect(mockFileService.getFileMetadata).toHaveBeenCalledWith(validFileId);
    });

    it('should return 404 when file not found', async () => {
      mockFileService.getFileMetadata.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/files/550e8400-e29b-41d4-a716-446655440099');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FILE_NOT_FOUND');
    });

    it('should return 400 for invalid file ID format', async () => {
      const response = await request(app)
        .get('/api/files/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/files/:fileId/signed-url', () => {
    it('should return signed URL', async () => {
      const mockSignedUrl = 'https://signed-url.example.com';
      mockFileService.getFileSignedUrl.mockResolvedValueOnce(mockSignedUrl);

      const response = await request(app)
        .get(`/api/files/${validFileId}/signed-url`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          signedUrl: mockSignedUrl,
          expiresIn: 3600,
        },
      });

      expect(mockFileService.getFileSignedUrl).toHaveBeenCalledWith(validFileId, undefined);
    });

    it('should return signed URL with custom expiration', async () => {
      const mockSignedUrl = 'https://signed-url.example.com';
      mockFileService.getFileSignedUrl.mockResolvedValueOnce(mockSignedUrl);

      const response = await request(app)
        .get(`/api/files/${validFileId}/signed-url?expiresIn=7200`);

      expect(response.status).toBe(200);
      expect(response.body.data.expiresIn).toBe(7200);

      expect(mockFileService.getFileSignedUrl).toHaveBeenCalledWith(validFileId, 7200);
    });

    it('should return 404 when file not found', async () => {
      mockFileService.getFileSignedUrl.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/files/550e8400-e29b-41d4-a716-446655440099/signed-url');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FILE_NOT_FOUND');
    });

    it('should validate expiration time limits', async () => {
      // Test minimum limit
      let response = await request(app)
        .get('/api/files/file-123/signed-url?expiresIn=30');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');

      // Test maximum limit
      response = await request(app)
        .get('/api/files/file-123/signed-url?expiresIn=700000');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/files/:fileId', () => {
    it('should delete file successfully', async () => {
      mockFileService.deleteFile.mockResolvedValueOnce(true);

      const response = await request(app)
        .delete('/api/files/file-123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'File deleted successfully',
      });

      expect(mockFileService.deleteFile).toHaveBeenCalledWith('file-123');
    });

    it('should return 404 when file not found', async () => {
      mockFileService.deleteFile.mockResolvedValueOnce(false);

      const response = await request(app)
        .delete('/api/files/non-existent-file');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FILE_NOT_FOUND');
    });

    it('should handle delete service errors', async () => {
      mockFileService.deleteFile.mockRejectedValueOnce(new Error('S3 delete failed'));

      const response = await request(app)
        .delete('/api/files/file-123');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
    });
  });

  describe('GET /api/files/entity/:entityType/:entityId', () => {
    it('should return files for entity', async () => {
      const mockFiles = [
        {
          id: 'file-1',
          originalName: 'test1.pdf',
          fileName: 'file1.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          entityType: FileEntityType.test,
          entityId: 'test-entity-123',
          isPublic: false,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'file-2',
          originalName: 'test2.pdf',
          fileName: 'file2.pdf',
          mimeType: 'application/pdf',
          size: 2048,
          entityType: FileEntityType.test,
          entityId: 'test-entity-123',
          isPublic: true,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      mockFileService.getFilesByEntity.mockResolvedValueOnce(mockFiles);

      const response = await request(app)
        .get('/api/files/entity/test/test-entity-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].id).toBe('file-1');
      expect(response.body.data[1].id).toBe('file-2');

      expect(mockFileService.getFilesByEntity).toHaveBeenCalledWith('test', 'test-entity-123');
    });

    it('should return empty array when no files found', async () => {
      mockFileService.getFilesByEntity.mockResolvedValueOnce([]);

      const response = await request(app)
        .get('/api/files/entity/test/test-entity-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should validate entity type', async () => {
      const response = await request(app)
        .get('/api/files/entity/invalid_type/test-entity-123');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate entity ID format', async () => {
      const response = await request(app)
        .get('/api/files/entity/test/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/files/upload-multiple', () => {
    it('should upload multiple files successfully', async () => {
      const mockUploadResults = [
        {
          id: 'file-1',
          fileName: 'test1.pdf',
          s3Key: 'test/2024-01-01/test1.pdf',
          cloudFrontUrl: 'https://cdn.example.com/test/2024-01-01/test1.pdf',
          signedUrl: 'https://signed-url1.example.com',
        },
        {
          id: 'file-2',
          fileName: 'test2.pdf',
          s3Key: 'test/2024-01-01/test2.pdf',
          cloudFrontUrl: 'https://cdn.example.com/test/2024-01-01/test2.pdf',
          signedUrl: 'https://signed-url2.example.com',
        },
      ];

      mockFileService.uploadFile
        .mockResolvedValueOnce(mockUploadResults[0])
        .mockResolvedValueOnce(mockUploadResults[1]);

      const response = await request(app)
        .post('/api/files/upload-multiple')
        .attach('files', Buffer.from('test content 1'), 'test1.pdf')
        .attach('files', Buffer.from('test content 2'), 'test2.pdf')
        .field('entityType', 'test')
        .field('entityId', 'test-entity-123')
        .field('isPublic', 'false');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.message).toBe('2 files uploaded successfully');

      expect(mockFileService.uploadFile).toHaveBeenCalledTimes(2);
    });

    it('should return 400 when no files provided', async () => {
      const response = await request(app)
        .post('/api/files/upload-multiple')
        .field('entityType', 'test')
        .field('entityId', 'test-entity-123');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_FILES');
    });

    it('should handle partial upload failures', async () => {
      mockFileService.uploadFile
        .mockResolvedValueOnce({
          id: 'file-1',
          fileName: 'test1.pdf',
          s3Key: 'test/2024-01-01/test1.pdf',
        })
        .mockRejectedValueOnce(new Error('Upload failed for second file'));

      const response = await request(app)
        .post('/api/files/upload-multiple')
        .attach('files', Buffer.from('test content 1'), 'test1.pdf')
        .attach('files', Buffer.from('test content 2'), 'test2.pdf')
        .field('entityType', 'test')
        .field('entityId', 'test-entity-123');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UPLOAD_ERROR');
    });
  });

  describe('Authentication', () => {
    beforeEach(() => {
      // Reset the auth middleware mock
      jest.doMock('../../middleware/auth', () => ({
        authenticateToken: (req: any, res: any, next: any) => {
          res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          });
        },
      }));
    });

    afterEach(() => {
      // Restore the original auth middleware mock
      jest.doMock('../../middleware/auth', () => ({
        authenticateToken: (req: any, res: any, next: any) => {
          req.user = { id: 'user-123', email: 'test@example.com' };
          next();
        },
      }));
    });

    it('should require authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'post', path: '/api/files/upload' },
        { method: 'get', path: '/api/files/file-123' },
        { method: 'get', path: '/api/files/file-123/signed-url' },
        { method: 'delete', path: '/api/files/file-123' },
        { method: 'get', path: '/api/files/entity/test/entity-123' },
        { method: 'post', path: '/api/files/upload-multiple' },
      ];

      for (const endpoint of endpoints) {
        let response;
        switch (endpoint.method) {
          case 'post':
            response = await request(app).post(endpoint.path);
            break;
          case 'get':
            response = await request(app).get(endpoint.path);
            break;
          case 'delete':
            response = await request(app).delete(endpoint.path);
            break;
          default:
            throw new Error(`Unsupported method: ${endpoint.method}`);
        }
        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('UNAUTHORIZED');
      }
    });
  });
});