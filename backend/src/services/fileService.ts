import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaClient, FileEntityType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { awsConfig, getS3Config } from '../config/aws';

const prisma = new PrismaClient();

export interface FileUploadRequest {
  originalName: string;
  buffer: Buffer;
  mimeType: string;
  size: number;
  entityType: FileEntityType;
  entityId?: string;
  uploadedBy?: string;
  isPublic?: boolean;
}

export interface FileUploadResponse {
  id: string;
  fileName: string;
  s3Key: string;
  cloudFrontUrl?: string;
  signedUrl?: string;
}

export interface FileMetadata {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  entityType: FileEntityType;
  entityId?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class FileService {
  private s3Client: S3Client;
  private bucketName: string;
  private cloudFrontDomain?: string;
  private signedUrlExpiration: number;
  private maxFileSize: number;
  private allowedFileTypes: string[];

  constructor() {
    const s3Config = getS3Config(awsConfig);
    this.s3Client = new S3Client(s3Config);
    this.bucketName = awsConfig.aws.s3.bucketName;
    this.cloudFrontDomain = awsConfig.aws.cloudfront.distributionDomain;
    this.signedUrlExpiration = awsConfig.aws.s3.signedUrlExpiration;
    this.maxFileSize = this.parseFileSize(awsConfig.aws.s3.maxFileSize);
    this.allowedFileTypes = awsConfig.aws.s3.allowedFileTypes;
  }

  /**
   * Upload a file to S3 and save metadata to database
   */
  async uploadFile(fileData: FileUploadRequest): Promise<FileUploadResponse> {
    // Validate file
    this.validateFile(fileData);

    // Generate unique filename
    const fileExtension = this.getFileExtension(fileData.originalName);
    const fileName = `${uuidv4()}${fileExtension}`;
    const s3Key = this.generateS3Key(fileData.entityType, fileName);

    try {
      // Upload to S3
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: fileData.buffer,
        ContentType: fileData.mimeType,
        Metadata: {
          originalName: fileData.originalName,
          entityType: fileData.entityType,
          entityId: fileData.entityId || '',
          uploadedBy: fileData.uploadedBy || '',
        },
      });

      await this.s3Client.send(uploadCommand);

      // Generate CloudFront URL if available
      const cloudFrontUrl = this.cloudFrontDomain 
        ? `https://${this.cloudFrontDomain}/${s3Key}`
        : undefined;

      // Save metadata to database
      const file = await prisma.file.create({
        data: {
          originalName: fileData.originalName,
          fileName,
          mimeType: fileData.mimeType,
          size: fileData.size,
          s3Key,
          s3Bucket: this.bucketName,
          cloudFrontUrl,
          uploadedBy: fileData.uploadedBy,
          entityType: fileData.entityType,
          entityId: fileData.entityId,
          isPublic: fileData.isPublic || false,
        },
      });

      // Generate signed URL for immediate access
      const signedUrl = await this.generateSignedUrl(s3Key);

      return {
        id: file.id,
        fileName: file.fileName,
        s3Key: file.s3Key,
        cloudFrontUrl: file.cloudFrontUrl || undefined,
        signedUrl,
      };
    } catch (error) {
      throw new Error(`Failed to upload file: ${error}`);
    }
  }

  /**
   * Get file metadata by ID
   */
  async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return null;
    }

    return {
      id: file.id,
      originalName: file.originalName,
      fileName: file.fileName,
      mimeType: file.mimeType,
      size: file.size,
      entityType: file.entityType,
      entityId: file.entityId || undefined,
      isPublic: file.isPublic,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }

  /**
   * Generate signed URL for file access
   */
  async generateSignedUrl(s3Key: string, expiresIn?: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
    });

    return await getSignedUrl(this.s3Client, command, {
      expiresIn: expiresIn || this.signedUrlExpiration,
    });
  }

  /**
   * Get signed URL for a file by ID
   */
  async getFileSignedUrl(fileId: string, expiresIn?: number): Promise<string | null> {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return null;
    }

    return await this.generateSignedUrl(file.s3Key, expiresIn);
  }

  /**
   * Delete a file from S3 and database
   */
  async deleteFile(fileId: string): Promise<boolean> {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return false;
    }

    try {
      // Delete from S3
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: file.s3Key,
      });

      await this.s3Client.send(deleteCommand);

      // Delete from database
      await prisma.file.delete({
        where: { id: fileId },
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to delete file: ${error}`);
    }
  }

  /**
   * Get files by entity
   */
  async getFilesByEntity(entityType: FileEntityType, entityId: string): Promise<FileMetadata[]> {
    const files = await prisma.file.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return files.map(file => ({
      id: file.id,
      originalName: file.originalName,
      fileName: file.fileName,
      mimeType: file.mimeType,
      size: file.size,
      entityType: file.entityType,
      entityId: file.entityId || undefined,
      isPublic: file.isPublic,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    }));
  }

  /**
   * Validate file before upload
   */
  private validateFile(fileData: FileUploadRequest): void {
    // Check file size
    if (fileData.size > this.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${this.formatFileSize(this.maxFileSize)}`);
    }

    // Check file type
    if (!this.allowedFileTypes.includes(fileData.mimeType)) {
      throw new Error(`File type ${fileData.mimeType} is not allowed. Allowed types: ${this.allowedFileTypes.join(', ')}`);
    }

    // Check file name
    if (!fileData.originalName || fileData.originalName.trim().length === 0) {
      throw new Error('File name is required');
    }
  }

  /**
   * Generate S3 key based on entity type and filename
   */
  private generateS3Key(entityType: FileEntityType, fileName: string): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `${entityType}/${timestamp}/${fileName}`;
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
  }

  /**
   * Parse file size string to bytes
   */
  private parseFileSize(sizeStr: string): number {
    const units: { [key: string]: number } = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
    };

    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([A-Z]{1,2})$/i);
    if (!match) {
      throw new Error(`Invalid file size format: ${sizeStr}`);
    }

    const [, size, unit] = match;
    const multiplier = units[unit.toUpperCase()];
    if (!multiplier) {
      throw new Error(`Unknown file size unit: ${unit}`);
    }

    return Math.floor(parseFloat(size) * multiplier);
  }

  /**
   * Format file size in bytes to human readable format
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

export const fileService = new FileService();