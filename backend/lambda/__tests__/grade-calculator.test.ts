import { handler } from '../grade-calculator/index';
import { PrismaClient } from '@prisma/client';
import { ScheduledEvent } from 'aws-lambda';

// Get the mocked Prisma instance
const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

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

describe('Grade Calculator Lambda', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should calculate grades for test results without grades', async () => {
    // Mock test results data
    const mockTestResults = [
      {
        id: 'result1',
        testId: 'test1',
        studentId: 'student1',
        score: 85,
        maxScore: 100,
        grade: null,
        test: { id: 'test1', title: 'Math Test' },
        student: { id: 'student1', name: 'John Doe' },
      },
      {
        id: 'result2',
        testId: 'test1',
        studentId: 'student2',
        score: 92,
        maxScore: 100,
        grade: null,
        test: { id: 'test1', title: 'Math Test' },
        student: { id: 'student2', name: 'Jane Smith' },
      },
    ];

    mockPrisma.testResult.findMany.mockResolvedValue(mockTestResults);
    mockPrisma.testResult.update.mockResolvedValue({});
    mockPrisma.class.findMany.mockResolvedValue([]);

    const event = createMockEvent();
    const result = await handler(event, {} as any, {} as any);

    expect(result.statusCode).toBe(200);
    expect(mockPrisma.testResult.findMany).toHaveBeenCalledWith({
      where: {
        grade: null,
        score: { not: null },
      },
      include: {
        test: true,
        student: true,
      },
    });

    expect(mockPrisma.testResult.update).toHaveBeenCalledTimes(2);
    
    // Check first update call
    expect(mockPrisma.testResult.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'result1' },
      data: {
        percentage: 85,
        grade: 'B',
        updatedDate: expect.any(Date),
      },
    });

    // Check second update call
    expect(mockPrisma.testResult.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'result2' },
      data: {
        percentage: 92,
        grade: 'A-',
        updatedDate: expect.any(Date),
      },
    });
  });

  it('should handle empty test results', async () => {
    mockPrisma.testResult.findMany.mockResolvedValue([]);
    mockPrisma.class.findMany.mockResolvedValue([]);

    const event = createMockEvent();
    const result = await handler(event, {} as any, {} as any);

    expect(result.statusCode).toBe(200);
    expect(mockPrisma.testResult.update).not.toHaveBeenCalled();
  });

  it('should handle database errors gracefully', async () => {
    mockPrisma.testResult.findMany.mockRejectedValue(new Error('Database connection failed'));

    const event = createMockEvent();

    await expect(handler(event, {} as any, {} as any)).rejects.toThrow('Database connection failed');
    expect(mockPrisma.$disconnect).toHaveBeenCalled();
  });

  describe('Grade calculation logic', () => {
    it('should calculate correct letter grades', async () => {
      const testCases = [
        { score: 98, maxScore: 100, expectedGrade: 'A+' },
        { score: 95, maxScore: 100, expectedGrade: 'A' },
        { score: 90, maxScore: 100, expectedGrade: 'A-' },
        { score: 87, maxScore: 100, expectedGrade: 'B+' },
        { score: 83, maxScore: 100, expectedGrade: 'B' },
        { score: 80, maxScore: 100, expectedGrade: 'B-' },
        { score: 77, maxScore: 100, expectedGrade: 'C+' },
        { score: 73, maxScore: 100, expectedGrade: 'C' },
        { score: 70, maxScore: 100, expectedGrade: 'C-' },
        { score: 67, maxScore: 100, expectedGrade: 'D+' },
        { score: 63, maxScore: 100, expectedGrade: 'D' },
        { score: 60, maxScore: 100, expectedGrade: 'D-' },
        { score: 50, maxScore: 100, expectedGrade: 'F' },
      ];

      for (const testCase of testCases) {
        const mockTestResult = [{
          id: 'result1',
          testId: 'test1',
          studentId: 'student1',
          score: testCase.score,
          maxScore: testCase.maxScore,
          grade: null,
          test: { id: 'test1', title: 'Test' },
          student: { id: 'student1', name: 'Student' },
        }];

        mockPrisma.testResult.findMany.mockResolvedValue(mockTestResult);
        mockPrisma.testResult.update.mockResolvedValue({});
        mockPrisma.class.findMany.mockResolvedValue([]);

        const event = createMockEvent();
        await handler(event, {} as any, {} as any);

        expect(mockPrisma.testResult.update).toHaveBeenCalledWith({
          where: { id: 'result1' },
          data: {
            percentage: testCase.score,
            grade: testCase.expectedGrade,
            updatedDate: expect.any(Date),
          },
        });

        jest.clearAllMocks();
      }
    });
  });
});