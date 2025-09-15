import { handler } from '../email-notifications/index';
import { PrismaClient } from '@prisma/client';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { ScheduledEvent } from 'aws-lambda';

// Import the response type
type EmailNotificationResponse = {
  statusCode: number;
  body: string;
};

// Mock Prisma
jest.mock('@prisma/client');
const mockPrisma = {
  test: {
    findMany: jest.fn(),
  },
  testResult: {
    findMany: jest.fn(),
  },
  class: {
    findMany: jest.fn(),
  },
  attendanceRecord: {
    count: jest.fn(),
  },
  $disconnect: jest.fn().mockResolvedValue(undefined),
};

(PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);

// Mock SES
jest.mock('@aws-sdk/client-ses');
const mockSESClient = {
  send: jest.fn(),
};

(SESClient as jest.Mock).mockImplementation(() => mockSESClient);

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

describe('Email Notifications Lambda', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FROM_EMAIL = 'test@example.com';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should send assignment due notifications', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const mockTests = [
      {
        id: 'test1',
        title: 'Math Quiz',
        testDate: tomorrow,
        classId: 'class1',
        class: {
          id: 'class1',
          name: 'Mathematics',
          enrollments: [
            {
              studentId: 'student1',
              student: {
                id: 'student1',
                name: 'John Doe',
                email: 'john@example.com',
              },
            },
          ],
        },
      },
    ];

    mockPrisma.test.findMany.mockResolvedValue(mockTests);
    mockPrisma.testResult.findMany.mockResolvedValue([]);
    mockPrisma.class.findMany.mockResolvedValue([]);
    mockPrisma.attendanceRecord.count.mockResolvedValue(0);
    mockSESClient.send.mockResolvedValue({});

    const event = createMockEvent();
    const result = await handler(event, {} as any, {} as any) as EmailNotificationResponse;

    expect(result.statusCode).toBe(200);
    expect(mockSESClient.send).toHaveBeenCalledTimes(1);
    
    const sentCommand = mockSESClient.send.mock.calls[0][0];
    expect(sentCommand).toBeInstanceOf(SendEmailCommand);
    expect(sentCommand.input.Destination.ToAddresses).toContain('john@example.com');
    expect(sentCommand.input.Message.Subject.Data).toContain('Math Quiz');
  });

  it('should send grade update notifications', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const mockTestResults = [
      {
        id: 'result1',
        testId: 'test1',
        studentId: 'student1',
        grade: 'A',
        percentage: 95,
        feedback: 'Great work!',
        gradedDate: yesterday,
        student: {
          id: 'student1',
          name: 'John Doe',
          email: 'john@example.com',
        },
        test: {
          id: 'test1',
          title: 'Math Test',
          class: {
            id: 'class1',
            name: 'Mathematics',
          },
        },
      },
    ];

    mockPrisma.test.findMany.mockResolvedValue([]);
    mockPrisma.testResult.findMany.mockResolvedValue(mockTestResults);
    mockPrisma.class.findMany.mockResolvedValue([]);
    mockPrisma.attendanceRecord.count.mockResolvedValue(0);
    mockSESClient.send.mockResolvedValue({});

    const event = createMockEvent();
    const result = await handler(event, {} as any, {} as any) as EmailNotificationResponse;

    expect(result.statusCode).toBe(200);
    expect(mockSESClient.send).toHaveBeenCalledTimes(1);
    
    const sentCommand = mockSESClient.send.mock.calls[0][0];
    expect(sentCommand).toBeInstanceOf(SendEmailCommand);
    expect(sentCommand.input.Destination.ToAddresses).toContain('john@example.com');
    expect(sentCommand.input.Message.Subject.Data).toContain('Grade Update');
    expect(sentCommand.input.Message.Body.Html.Data).toContain('95.0%');
    expect(sentCommand.input.Message.Body.Html.Data).toContain('Great work!');
  });

  it('should send attendance alert notifications', async () => {
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
              email: 'john@example.com',
            },
          },
        ],
        attendanceRecords: [
          { studentId: 'student1', status: 'present' },
          { studentId: 'student1', status: 'absent' },
          { studentId: 'student1', status: 'absent' },
          { studentId: 'student1', status: 'absent' },
          { studentId: 'student1', status: 'absent' },
        ],
      },
    ];

    mockPrisma.test.findMany.mockResolvedValue([]);
    mockPrisma.testResult.findMany.mockResolvedValue([]);
    mockPrisma.class.findMany.mockResolvedValue(mockClasses);
    mockPrisma.attendanceRecord.count.mockResolvedValue(5); // 5 total sessions
    mockSESClient.send.mockResolvedValue({});

    const event = createMockEvent();
    const result = await handler(event, {} as any, {} as any) as EmailNotificationResponse;

    expect(result.statusCode).toBe(200);
    expect(mockSESClient.send).toHaveBeenCalledTimes(1);
    
    const sentCommand = mockSESClient.send.mock.calls[0][0];
    expect(sentCommand).toBeInstanceOf(SendEmailCommand);
    expect(sentCommand.input.Destination.ToAddresses).toContain('john@example.com');
    expect(sentCommand.input.Message.Subject.Data).toContain('Attendance Alert');
    expect(sentCommand.input.Message.Body.Html.Data).toContain('20.0%'); // 1 present out of 5 sessions
  });

  it('should handle SES errors gracefully', async () => {
    const mockTests = [
      {
        id: 'test1',
        title: 'Math Quiz',
        testDate: new Date(),
        classId: 'class1',
        class: {
          id: 'class1',
          name: 'Mathematics',
          enrollments: [
            {
              studentId: 'student1',
              student: {
                id: 'student1',
                name: 'John Doe',
                email: 'john@example.com',
              },
            },
          ],
        },
      },
    ];

    mockPrisma.test.findMany.mockResolvedValue(mockTests);
    mockPrisma.testResult.findMany.mockResolvedValue([]);
    mockPrisma.class.findMany.mockResolvedValue([]);
    mockPrisma.attendanceRecord.count.mockResolvedValue(0);
    mockSESClient.send.mockRejectedValue(new Error('SES error'));

    const event = createMockEvent();
    const result = await handler(event, {} as any, {} as any) as EmailNotificationResponse;

    // Should still return success even if some emails fail
    expect(result.statusCode).toBe(200);
    expect(result.body).toContain('"sentCount":0');
  });

  it('should skip attendance alerts for classes with too few sessions', async () => {
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
              email: 'john@example.com',
            },
          },
        ],
        attendanceRecords: [
          { studentId: 'student1', status: 'present' },
        ],
      },
    ];

    mockPrisma.test.findMany.mockResolvedValue([]);
    mockPrisma.testResult.findMany.mockResolvedValue([]);
    mockPrisma.class.findMany.mockResolvedValue(mockClasses);
    mockPrisma.attendanceRecord.count.mockResolvedValue(2); // Only 2 sessions, below threshold
    mockSESClient.send.mockResolvedValue({});

    const event = createMockEvent();
    const result = await handler(event, {} as any, {} as any) as EmailNotificationResponse;

    expect(result.statusCode).toBe(200);
    expect(mockSESClient.send).not.toHaveBeenCalled();
  });
});