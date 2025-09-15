import { Handler, ScheduledEvent } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';

const prisma = new PrismaClient();
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

interface CleanupResult {
  deletedSessions: number;
  deletedLogs: number;
  deletedFiles: number;
  archivedRecords: number;
}

export const handler: Handler<ScheduledEvent, CleanupResult> = async (event) => {
  console.log('Starting data cleanup and maintenance', { event });

  try {
    const result: CleanupResult = {
      deletedSessions: 0,
      deletedLogs: 0,
      deletedFiles: 0,
      archivedRecords: 0,
    };

    // Clean up expired sessions and tokens
    result.deletedSessions = await cleanupExpiredSessions();

    // Clean up old log entries
    result.deletedLogs = await cleanupOldLogs();

    // Clean up orphaned files in S3
    result.deletedFiles = await cleanupOrphanedFiles();

    // Archive old records
    result.archivedRecords = await archiveOldRecords();

    // Optimize database performance
    await optimizeDatabase();

    console.log('Data cleanup completed successfully', result);

    return result;
  } catch (error) {
    console.error('Error in data cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

async function cleanupExpiredSessions(): Promise<number> {
  // Clean up expired refresh tokens (older than 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Note: This assumes you have a sessions or refresh_tokens table
  // Adjust based on your actual authentication implementation
  try {
    const result = await prisma.$executeRaw`
      DELETE FROM user_sessions 
      WHERE expires_at < ${thirtyDaysAgo} OR last_accessed < ${thirtyDaysAgo}
    `;
    
    console.log(`Deleted ${result} expired sessions`);
    return Number(result);
  } catch (error) {
    // Table might not exist yet, that's okay
    console.log('No sessions table found, skipping session cleanup');
    return 0;
  }
}

async function cleanupOldLogs(): Promise<number> {
  // Clean up application logs older than 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  try {
    const result = await prisma.$executeRaw`
      DELETE FROM application_logs 
      WHERE created_at < ${ninetyDaysAgo}
    `;
    
    console.log(`Deleted ${result} old log entries`);
    return Number(result);
  } catch (error) {
    // Table might not exist yet, that's okay
    console.log('No application_logs table found, skipping log cleanup');
    return 0;
  }
}

async function cleanupOrphanedFiles(): Promise<number> {
  const bucketName = process.env.S3_BUCKET_NAME;
  if (!bucketName) {
    console.log('S3_BUCKET_NAME not configured, skipping file cleanup');
    return 0;
  }

  let deletedCount = 0;

  try {
    // Get all files from S3
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'uploads/',
    });

    const s3Objects = await s3Client.send(listCommand);
    
    if (!s3Objects.Contents) {
      return 0;
    }

    // Get all file references from database
    const dbFiles = await prisma.test.findMany({
      select: { fileName: true },
      where: { fileName: { not: null } },
    });

    const dbFileNames = new Set(dbFiles.map(f => f.fileName).filter(Boolean));

    // Find orphaned files (files in S3 but not referenced in DB)
    for (const s3Object of s3Objects.Contents) {
      if (!s3Object.Key) continue;
      
      const fileName = s3Object.Key.split('/').pop();
      if (!fileName || dbFileNames.has(fileName)) continue;

      // Check if file is older than 7 days before deleting
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      if (s3Object.LastModified && s3Object.LastModified < sevenDaysAgo) {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: bucketName,
          Key: s3Object.Key,
        }));
        
        deletedCount++;
        console.log(`Deleted orphaned file: ${s3Object.Key}`);
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up orphaned files:', error);
    return 0;
  }
}

async function archiveOldRecords(): Promise<number> {
  // Archive attendance records older than 2 years
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  let archivedCount = 0;

  try {
    // Move old attendance records to archive table
    const oldAttendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        date: {
          lt: twoYearsAgo,
        },
      },
    });

    if (oldAttendanceRecords.length > 0) {
      // Create archive table if it doesn't exist
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS archived_attendance_records (
          LIKE attendance_records INCLUDING ALL
        )
      `;

      // Insert into archive
      for (const record of oldAttendanceRecords) {
        await prisma.$executeRaw`
          INSERT INTO archived_attendance_records 
          SELECT * FROM attendance_records WHERE id = ${record.id}
        `;
      }

      // Delete from main table
      await prisma.attendanceRecord.deleteMany({
        where: {
          id: {
            in: oldAttendanceRecords.map(r => r.id),
          },
        },
      });

      archivedCount += oldAttendanceRecords.length;
    }

    // Archive old test results (older than 3 years)
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const oldTestResults = await prisma.testResult.findMany({
      where: {
        createdDate: {
          lt: threeYearsAgo,
        },
      },
    });

    if (oldTestResults.length > 0) {
      // Create archive table if it doesn't exist
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS archived_test_results (
          LIKE test_results INCLUDING ALL
        )
      `;

      // Insert into archive
      for (const result of oldTestResults) {
        await prisma.$executeRaw`
          INSERT INTO archived_test_results 
          SELECT * FROM test_results WHERE id = ${result.id}
        `;
      }

      // Delete from main table
      await prisma.testResult.deleteMany({
        where: {
          id: {
            in: oldTestResults.map(r => r.id),
          },
        },
      });

      archivedCount += oldTestResults.length;
    }

    console.log(`Archived ${archivedCount} old records`);
    return archivedCount;
  } catch (error) {
    console.error('Error archiving old records:', error);
    return 0;
  }
}

async function optimizeDatabase(): Promise<void> {
  try {
    // Update table statistics for better query planning
    await prisma.$executeRaw`ANALYZE`;
    
    // Vacuum to reclaim space from deleted records
    await prisma.$executeRaw`VACUUM`;
    
    console.log('Database optimization completed');
  } catch (error) {
    console.error('Error optimizing database:', error);
  }
}