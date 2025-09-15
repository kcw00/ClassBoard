// Jest setup file for Lambda functions

// Mock environment variables
process.env.AWS_REGION = 'us-east-1';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.S3_BUCKET_NAME = 'test-bucket';
process.env.FROM_EMAIL = 'test@example.com';

// Mock Prisma Client globally
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    testResult: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    test: {
      findMany: jest.fn(),
    },
    class: {
      findMany: jest.fn(),
    },
    attendanceRecord: {
      count: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $executeRaw: jest.fn(),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock AWS SDK clients globally
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  PutObjectCommand: jest.fn(),
  ListObjectsV2Command: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  SendEmailCommand: jest.fn(),
}));

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Global test utilities
global.createMockEvent = (source = 'aws.events', detailType = 'Scheduled Event') => ({
  id: 'test-event-id',
  'detail-type': detailType,
  source,
  account: '123456789012',
  time: new Date().toISOString(),
  region: 'us-east-1',
  detail: {},
  resources: [],
  version: '0',
});

global.createMockContext = () => ({
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test-function',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
  memoryLimitInMB: '128',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/test-function',
  logStreamName: '2024/01/01/[$LATEST]test-stream',
  getRemainingTimeInMillis: () => 30000,
  done: jest.fn(),
  fail: jest.fn(),
  succeed: jest.fn(),
});