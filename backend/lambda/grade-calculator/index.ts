import { Handler, ScheduledEvent } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface GradeCalculationResult {
  testId: string;
  studentId: string;
  calculatedGrade: string;
  percentage: number;
}

interface GradeCalculatorResponse {
  statusCode: number;
  body: string;
}

interface TestWithResults {
  id: string;
  testResults: any[];
}

export const handler: Handler<ScheduledEvent, GradeCalculatorResponse> = async (event) => {
  console.log('Starting automated grade calculation', { event });

  try {
    // Get all test results that need grade calculation
    const testResults = await prisma.testResult.findMany({
      where: {
        grade: null, // Only process results without calculated grades
        score: { not: null }, // Only process results with scores
      },
      include: {
        test: true,
        student: true,
      },
    });

    console.log(`Found ${testResults.length} test results to process`);

    const calculations: GradeCalculationResult[] = [];

    for (const result of testResults) {
      const percentage = (result.score / result.maxScore) * 100;
      const grade = calculateLetterGrade(percentage);

      // Update the test result with calculated grade
      await prisma.testResult.update({
        where: { id: result.id },
        data: {
          percentage,
          grade,
          updatedDate: new Date(),
        },
      });

      calculations.push({
        testId: result.testId,
        studentId: result.studentId,
        calculatedGrade: grade,
        percentage,
      });

      console.log(`Calculated grade for student ${result.student.name}: ${grade} (${percentage}%)`);
    }

    // Calculate class averages and update statistics
    await updateClassStatistics();

    console.log(`Successfully processed ${calculations.length} grade calculations`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Grade calculation completed successfully',
        processedCount: calculations.length,
        calculations,
      }),
    };
  } catch (error) {
    console.error('Error in grade calculation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

function calculateLetterGrade(percentage: number): string {
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
}

async function updateClassStatistics(): Promise<void> {
  // Get all classes with test results
  const classes = await prisma.class.findMany({
    include: {
      tests: {
        include: {
          testResults: true,
        },
      },
    },
  });

  for (const classItem of classes) {
    const allResults = classItem.tests.flatMap((test: TestWithResults) => test.testResults);

    if (allResults.length > 0) {
      const averagePercentage = allResults.reduce((sum: number, result: any) => sum + (result.percentage || 0), 0) / allResults.length;

      // Store class statistics (you might want to create a separate table for this)
      console.log(`Class ${classItem.name} average: ${averagePercentage.toFixed(2)}%`);
    }
  }
}