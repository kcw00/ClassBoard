import { handler } from '../report-generator/index';
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ScheduledEvent } from 'aws-lambda';

// Import the response type
type ReportGeneratorResponse = {
  statusCode: number;
  body: string;
};

// Mock Prisma
jest.mock('@prisma/client');
const mockPrisma = {
  class: {
    findMany: jest.fn(),
  },
  attendanceRecord: {
    count: jest.fn(),
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

describe('Report Generator Lambda', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.S3_BUCKET_NAME = 'test-bucket';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should generate attendance reports', async () => {
    const mockClasses = [
      {
        id: 'class1',
        name: 'Mathematics',
        enrollments: [
          {
            studentId: 'student1',
            student: {
              id: 'student1',
              name: 'John Doe',
            },
          },
          {
            studentId: 'student2',
            student: {
              id: 'student2',
              name: 'Jane Smith',
            },
          },
        ],
        attendanceRecords: [
          { studentId: 'student1', status: 'present', date: new Date() },
          { studentId: 'student1', status: 'present', date: new Date() },
          { studentId: 'student2', status: 'present', date: new Date() },
          { studentId: 'student2', status: 'absent', date: new Date() },
        ],
      },
    ];

    mockPrisma.class.findMany.mockResolvedValue(mockClasses);
    mockPrisma.attendanceRecord.count.mockResolvedValue(2); // 2 total sessions
    mockS3Client.send.mockResolvedValue({});

    const event = createMockEvent();
    const result = await handler(event, {} as any, {} as any) as ReportGeneratorResponse;

    expect(result.statusCode).toBe(200);
    expect(mockS3Client.send).toHaveBeenCalledTimes(2); // attendance + performance reports

    // Check attendance report upload
    const attendanceCall = mockS3Client.send.mock.calls.find(call =>
      call[0].input.Key.includes('attendance-report')
    );
    expect(attendanceCall).toBeDefined();
    expect(attendanceCall[0]).toBeInstanceOf(PutObjectCommand);

    const attendanceData = JSON.parse(attendanceCall[0].input.Body);
    expect(attendanceData).toHaveLength(1);
    expect(attendanceData[0].className).toBe('Mathematics');
    expect(attendanceData[0].studentAttendance).toHaveLength(2);
    expect(attendanceData[0].studentAttendance[0].attendanceRate).toBe(100); // John: 2/2 = 100%
    expect(attendanceData[0].studentAttendance[1].attendanceRate).toBe(50);  // Jane: 1/2 = 50%
  });

  it('should generate performance reports', async () => {
    const mockClasses = [
      {
        id: 'class1',
        name: 'Mathematics',
        enrollments: [
          {
            studentId: 'student1',
            student: {
              id: 'student1',
              name: 'John Doe',
            },
          },
        ],
        attendanceRecords: [],
        tests: [
          {
            id: 'test1',
            title: 'Math Test 1',
            testDate: new Date(),
            testResults: [
              {
                id: 'result1',
                studentId: 'student1',
                score: 85,
                percentage: 85,
                student: {
                  id: 'student1',
                  name: 'John Doe',
                },
              },
            ],
          },
          {
            id: 'test2',
            title: 'Math Test 2',
            testDate: new Date(),
            testResults: [
              {
                id: 'result2',
                studentId: 'student1',
                score: 92,
                percentage: 92,
                student: {
                  id: 'student1',
                  name: 'John Doe',
                },
              },
            ],
          },
        ],
      },
    ];

    mockPrisma.class.findMany.mockResolvedValue(mockClasses);
    mockPrisma.attendanceRecord.count.mockResolvedValue(0);
    mockS3Client.send.mockResolvedValue({});

    const event = createMockEvent();
    const result = await handler(event, {} as any, {} as any) as ReportGeneratorResponse;

    expect(result.statusCode).toBe(200);

    // Check performance report upload
    const performanceCall = mockS3Client.send.mock.calls.find(call =>
      call[0].input.Key.includes('performance-report')
    );
    expect(performanceCall).toBeDefined();

    const performanceData = JSON.parse(performanceCall[0].input.Body);
    expect(performanceData).toHaveLength(1);
    expect(performanceData[0].className).toBe('Mathematics');
    expect(performanceData[0].averageGrade).toBe(88.5); // (85 + 92) / 2
    expect(performanceData[0].totalTests).toBe(2);
    expect(performanceData[0].studentPerformance).toHaveLength(1);
    expect(performanceData[0].studentPerformance[0].averagePercentage).toBe(88.5);
    expect(performanceData[0].studentPerformance[0].letterGrade).toBe('B+');
  });

  it('should handle S3 upload errors', async () => {
    mockPrisma.class.findMany.mockResolvedValue([]);
    mockPrisma.attendanceRecord.count.mockResolvedValue(0);
    mockS3Client.send.mockRejectedValue(new Error('S3 upload failed'));

    const event = createMockEvent();

    await expect(handler(event, {} as any, {} as any)).rejects.toThrow('S3 upload failed');
  });

  it('should handle missing S3 bucket configuration', async () => {
    delete process.env.S3_BUCKET_NAME;

    mockPrisma.class.findMany.mockResolvedValue([]);
    mockPrisma.attendanceRecord.count.mockResolvedValue(0);

    const event = createMockEvent();

    await expect(handler(event, {} as any, {} as any)).rejects.toThrow('S3_BUCKET_NAME environment variable is required');
  });

  it('should handle empty classes gracefully', async () => {
    mockPrisma.class.findMany.mockResolvedValue([]);
    mockPrisma.attendanceRecord.count.mockResolvedValue(0);
    mockS3Client.send.mockResolvedValue({});

    const event = createMockEvent();
    const result = await handler(event, {} as any, {} as any) as ReportGeneratorResponse;

    expect(result.statusCode).toBe(200);
    expect(mockS3Client.send).toHaveBeenCalledTimes(2);

    // Both reports should be empty arrays
    const attendanceCall = mockS3Client.send.mock.calls.find(call =>
      call[0].input.Key.includes('attendance-report')
    );
    const performanceCall = mockS3Client.send.mock.calls.find(call =>
      call[0].input.Key.includes('performance-report')
    );

    expect(JSON.parse(attendanceCall[0].input.Body)).toEqual([]);
    expect(JSON.parse(performanceCall[0].input.Body)).toEqual([]);
  });
});