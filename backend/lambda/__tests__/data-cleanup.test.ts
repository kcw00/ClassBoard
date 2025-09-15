import { handler } from '../data-cleanup/index';
import { PrismaClient } from '@prisma/client';
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ScheduledEvent } from 'aws-lambda';

// Mock Prisma
jest.mock('@prisma/client');
const mockPrisma = {
  $executeRaw: jest.fn(),
  test: {
    findMany: jest.fn(),
  },
  attendanceRecord: {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  testResult: {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  $disconnect: jest.fn().mockResolvedValue(undefined),
};

(PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);

// Mock S3
jest.mock('@aws-sdk/client-s3');
const mockS3Client = {
  send: jest.fn(),
};

(S3Client as jest.Mock).mockImplementation(() => mockS3Client);

const createMockEvent = (): ScheduledEvent => ({
  id: 'test-event-id',
  'detail-type': 'Scheduled Event',
  source: 'aws.events',
  account: '123456789012',
  time: '2024-01-01T00:00:00Z',
  region: 'us-east-1',
  detail: {},
  resources: [],
  version: '0',
});

describe('Data Cleanup Lambda', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.S3_BUCKET_NAME = 'test-bucket';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should perform complete cleanup successfully', async () => {
    // Mock cleanup operations
    mockPrisma.$executeRaw
      .mockResolvedValueOnce(5) // deleted sessions
      .mockResolvedValueOnce(10) // deleted logs
      .mockResolvedValueOnce(undefined) // create archive table
      .mockResolvedValueOnce(undefined) // insert into archive
      .mockResolvedValueOnce(undefined) // create archive table
      .mockResolvedValueOnce(undefined) // insert into archive
      .mockResolvedValueOnce(undefined) // ANALYZE
      .mockResolvedValueOnce(undefined); // VACUUM

    // Mock S3 operations
    mockS3Client.send
      .mockResolvedValueOnce({
        Contents: [
          {
            Key: 'uploads/old-file.pdf',
            LastModified: new Date('2024-01-01'), // Old file
          },
          {
            Key: 'uploads/recent-file.pdf',
            LastModified: new Date(), // Recent file
          },
        ],
      })
      .mockResolvedValue({}); // Delete operations

    // Mock database file references
    mockPrisma.test.findMany.mockResolvedValue([
      { fileName: 'recent-file.pdf' },
    ]);

    // Mock old records
    mockPrisma.attendanceRecord.findMany.mockResolvedValue([
      { id: 'attendance1', date: new Date('2022-01-01') },
    ]);
    mockPrisma.testResult.findMany.mockResolvedValue([
      { id: 'result1', createdDate: new Date('2021-01-01') },
    ]);

    mockPrisma.attendanceRecord.deleteMany.mockResolvedValue({ count: 1 });
    mockPrisma.testResult.deleteMany.mockResolvedValue({ count: 1 });

    const event = createMockEvent();
    const result = await handler(event, {} as any, {} as any);

    expect(result.deletedSessions).toBe(5);
    expect(result.deletedLogs).toBe(10);
    expect(result.deletedFiles).toBe(1);
    expect(result.archivedRecords).toBe(2);

    // Verify S3 operations
    expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(ListObjectsV2Command));
    expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));

    // Verify database optimization
    expect(mockPrisma.$executeRaw).toHaveBeenCalledWith(expect.stringContaining('ANALYZE'));
    expect(mockPrisma.$executeRaw).toHaveBeenCalledWith(expect.stringContaining('VACUUM'));
  });

  it('should handle missing sessions table gracefully', async () => {
    mockPrisma.$executeRaw
      .mockRejectedValueOnce(new Error('Table does not exist')) // sessions cleanup fails
      .mockResolvedValueOnce(0) // logs cleanup succeeds
      .mockResolvedValue(undefined); // other operations

    mockS3Client.send.mockResolvedValue({ Contents: [] });
    mockPrisma.test.findMany.mockResolvedValue([]);
    mockPrisma.attendanceRecord.findMany.mockResolvedValue([]);
    mockPrisma.testResult.findMany.mockResolvedValue([]);

    const event = createMockEvent();
    const result = await handler(event, {} as any, {} as any);

    expect(result.deletedSessions).toBe(0);
    expect(result.deletedLogs).toBe(0);
  });

  it('should handle missing S3 bucket configuration', async () => {
    delete process.env.S3_BUCKET_NAME;

    mockPrisma.$executeRaw.mockResolvedValue(0);
    mockPrisma.attendanceRecord.findMany.mockResolvedValue([]);
    mockPrisma.testResult.findMany.mockResolvedValue([]);

    const event = createMockEvent();
    const result = await handler(event, {} as any, {} as any);

    expect(result.deletedFiles).toBe(0);
    expect(mockS3Client.send).not.toHaveBeenCalled();
  });

  it('should only delete old orphaned files', async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 8); // 8 days ago (older than 7 days)

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3); // 3 days ago (newer than 7 days)

    mockPrisma.$executeRaw.mockResolvedValue(0);
    mockS3Client.send.mockResolvedValueOnce({
      Contents: [
        {
          Key: 'uploads/old-orphaned-file.pdf',
          LastModified: sevenDaysAgo,
        },
        {
          Key: 'uploads/recent-orphaned-file.pdf',
          LastModified: threeDaysAgo,
        },
        {
          Key: 'uploads/referenced-file.pdf',
          LastModified: sevenDaysAgo,
        },
      ],
    }).mockResolvedValue({}); // Delete operations

    mockPrisma.test.findMany.mockResolvedValue([
      { fileName: 'referenced-file.pdf' },
    ]);

    mockPrisma.attendanceRecord.findMany.mockResolvedValue([]);
    mockPrisma.testResult.findMany.mockResolvedValue([]);

    const event = createMockEvent();
    const result = await handler(event, {} as any, {} as any);

    expect(result.deletedFiles).toBe(1); // Only old orphaned file should be deleted

    // Verify only the old orphaned file was deleted
    const deleteCall = mockS3Client.send.mock.calls.find(call => 
      call[0] instanceof DeleteObjectCommand
    );
    expect(deleteCall[0].input.Key).toBe('uploads/old-orphaned-file.pdf');
  });

  it('should archive old records correctly', async () => {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 3);

    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 4);

    mockPrisma.$executeRaw.mockResolvedValue(0);
    mockS3Client.send.mockResolvedValue({ Contents: [] });
    mockPrisma.test.findMany.mockResolvedValue([]);

    // Mock old records
    mockPrisma.attendanceRecord.findMany.mockResolvedValue([
      { id: 'attendance1', date: twoYearsAgo },
      { id: 'attendance2', date: twoYearsAgo },
    ]);
    mockPrisma.testResult.findMany.mockResolvedValue([
      { id: 'result1', createdDate: threeYearsAgo },
    ]);

    mockPrisma.attendanceRecord.deleteMany.mockResolvedValue({ count: 2 });
    mockPrisma.testResult.deleteMany.mockResolvedValue({ count: 1 });

    const event = createMockEvent();
    const result = await handler(event, {} as any, {} as any);

    expect(result.archivedRecords).toBe(3); // 2 attendance + 1 test result

    // Verify archive table creation
    expect(mockPrisma.$executeRaw).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS archived_attendance_records')
    );
    expect(mockPrisma.$executeRaw).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS archived_test_results')
    );
  });

  it('should handle S3 errors gracefully', async () => {
    mockPrisma.$executeRaw.mockResolvedValue(0);
    mockS3Client.send.mockRejectedValue(new Error('S3 error'));
    mockPrisma.test.findMany.mockResolvedValue([]);
    mockPrisma.attendanceRecord.findMany.mockResolvedValue([]);
    mockPrisma.testResult.findMany.mockResolvedValue([]);

    const event = createMockEvent();
    const result = await handler(event, {} as any, {} as any);

    expect(result.deletedFiles).toBe(0);
    // Should still complete other cleanup tasks
    expect(result.deletedSessions).toBe(0);
    expect(result.deletedLogs).toBe(0);
  });

  it('should handle database optimization errors gracefully', async () => {
    mockPrisma.$executeRaw
      .mockResolvedValueOnce(0) // sessions
      .mockResolvedValueOnce(0) // logs
      .mockRejectedValueOnce(new Error('ANALYZE failed')) // ANALYZE fails
      .mockRejectedValueOnce(new Error('VACUUM failed')); // VACUUM fails

    mockS3Client.send.mockResolvedValue({ Contents: [] });
    mockPrisma.test.findMany.mockResolvedValue([]);
    mockPrisma.attendanceRecord.findMany.mockResolvedValue([]);
    mockPrisma.testResult.findMany.mockResolvedValue([]);

    const event = createMockEvent();

    // Should not throw error even if optimization fails
    const result = await handler(event, {} as any, {} as any);

    expect(result.deletedSessions).toBe(0);
    expect(result.deletedLogs).toBe(0);
    expect(result.deletedFiles).toBe(0);
    expect(result.archivedRecords).toBe(0);
  });
});