import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { CognitoIdentityProviderClient, DescribeUserPoolCommand } from '@aws-sdk/client-cognito-identity-provider';
import config from '../config';
import { asyncHandler } from '../middleware/errorHandler';
import { monitoringService } from '../services/monitoringService';

const router = Router();
const prisma = new PrismaClient();

// Initialize AWS clients
const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

const cognitoClient = new CognitoIdentityProviderClient({
  region: config.aws.cognito.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

// Basic health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'ClassBoard API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.server.nodeEnv,
    uptime: process.uptime(),
  });
});

// Detailed health check with dependency status
router.get('/health/detailed', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  const healthChecks: any = {
    api: { status: 'healthy', responseTime: 0 },
    database: { status: 'unknown', responseTime: 0, error: null },
    s3: { status: 'unknown', responseTime: 0, error: null },
    cognito: { status: 'unknown', responseTime: 0, error: null },
  };

  // Check database connectivity
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    healthChecks.database = {
      status: 'healthy',
      responseTime: Date.now() - dbStart,
      error: null,
    };
  } catch (error) {
    healthChecks.database = {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }

  // Check S3 connectivity
  try {
    const s3Start = Date.now();
    await s3Client.send(new HeadBucketCommand({
      Bucket: config.aws.s3.bucketName,
    }));
    healthChecks.s3 = {
      status: 'healthy',
      responseTime: Date.now() - s3Start,
      error: null,
    };
  } catch (error) {
    healthChecks.s3 = {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown S3 error',
    };
  }

  // Check Cognito connectivity
  try {
    const cognitoStart = Date.now();
    await cognitoClient.send(new DescribeUserPoolCommand({
      UserPoolId: config.aws.cognito.userPoolId,
    }));
    healthChecks.cognito = {
      status: 'healthy',
      responseTime: Date.now() - cognitoStart,
      error: null,
    };
  } catch (error) {
    healthChecks.cognito = {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown Cognito error',
    };
  }

  // Calculate overall health
  const allHealthy = Object.values(healthChecks).every((check: any) => check.status === 'healthy');
  const overallStatus = allHealthy ? 'healthy' : 'degraded';

  // API response time
  healthChecks.api.responseTime = Date.now() - startTime;

  const response = {
    success: true,
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.server.nodeEnv,
    uptime: process.uptime(),
    checks: healthChecks,
    system: {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version,
    },
  };

  // Set appropriate HTTP status code
  const statusCode = overallStatus === 'healthy' ? 200 : 503;
  res.status(statusCode).json(response);
}));

// Readiness probe (for Kubernetes/container orchestration)
router.get('/health/ready', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Check if database is ready
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      success: true,
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}));

// Liveness probe (for Kubernetes/container orchestration)
router.get('/health/live', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Metrics endpoint for monitoring systems
router.get('/health/metrics', (req: Request, res: Response) => {
  const systemMetrics = monitoringService.getSystemMetrics();
  const aggregatedMetrics = monitoringService.getAggregatedMetrics(60); // Last 60 minutes
  
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    system: systemMetrics,
    aggregated: aggregatedMetrics,
    process: {
      pid: process.pid,
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
    },
  });
});

// Recent monitoring data endpoint
router.get('/health/monitoring', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const metrics = monitoringService.getMetrics(limit);
  const alerts = monitoringService.getAlerts(50);
  
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    data: {
      metrics,
      alerts,
      summary: {
        totalMetrics: metrics.length,
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.level === 'critical').length,
      },
    },
  });
});

// Specific metric endpoint
router.get('/health/metrics/:metricName', (req: Request, res: Response) => {
  const { metricName } = req.params;
  const limit = parseInt(req.query.limit as string) || 100;
  const metrics = monitoringService.getMetricsByName(metricName, limit);
  
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    metricName,
    data: metrics,
    count: metrics.length,
  });
});

export default router;