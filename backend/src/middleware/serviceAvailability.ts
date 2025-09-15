import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import config from '../config';

const prisma = new PrismaClient();
const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

// Service availability cache to avoid checking on every request
interface ServiceStatus {
  isAvailable: boolean;
  lastChecked: number;
  checkInterval: number; // in milliseconds
}

const serviceCache: {
  database: ServiceStatus;
  s3: ServiceStatus;
} = {
  database: {
    isAvailable: true,
    lastChecked: 0,
    checkInterval: 30000, // 30 seconds
  },
  s3: {
    isAvailable: true,
    lastChecked: 0,
    checkInterval: 60000, // 60 seconds
  },
};

// Check database availability
async function checkDatabaseAvailability(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database availability check failed:', error);
    return false;
  }
}

// Check S3 availability
async function checkS3Availability(): Promise<boolean> {
  try {
    await s3Client.send(new HeadBucketCommand({
      Bucket: config.aws.s3.bucketName,
    }));
    return true;
  } catch (error) {
    console.error('S3 availability check failed:', error);
    return false;
  }
}

// Update service status if check interval has passed
async function updateServiceStatus(service: 'database' | 's3'): Promise<void> {
  const now = Date.now();
  const serviceStatus = serviceCache[service];
  
  if (now - serviceStatus.lastChecked > serviceStatus.checkInterval) {
    let isAvailable = false;
    
    if (service === 'database') {
      isAvailable = await checkDatabaseAvailability();
    } else if (service === 's3') {
      isAvailable = await checkS3Availability();
    }
    
    serviceStatus.isAvailable = isAvailable;
    serviceStatus.lastChecked = now;
    
    // Log service status changes
    if (serviceStatus.isAvailable !== isAvailable) {
      const logLevel = isAvailable ? 'info' : 'error';
      const message = `${service.toUpperCase()} service ${isAvailable ? 'recovered' : 'unavailable'}`;
      
      console[logLevel](JSON.stringify({
        timestamp: new Date().toISOString(),
        level: logLevel,
        type: 'service_availability',
        service,
        status: isAvailable ? 'available' : 'unavailable',
        message,
        alert: !isAvailable,
        severity: !isAvailable ? 'critical' : 'info',
      }));
    }
  }
}

// Middleware to check database availability
export const requireDatabase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await updateServiceStatus('database');
  
  if (!serviceCache.database.isAvailable) {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Database service is currently unavailable. Please try again later.',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
      requestId: req.requestId,
    });
    return;
  }
  
  next();
};

// Middleware to check S3 availability (with graceful degradation)
export const requireS3 = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await updateServiceStatus('s3');
  
  if (!serviceCache.s3.isAvailable) {
    // For file operations, return error
    if (req.path.includes('/files') && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
      res.status(503).json({
        success: false,
        error: {
          code: 'FILE_SERVICE_UNAVAILABLE',
          message: 'File storage service is currently unavailable. Please try again later.',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        requestId: req.requestId,
      });
      return;
    }
    
    // For other operations, add warning but continue
    (req as any).s3Unavailable = true;
  }
  
  next();
};

// Middleware to add service status to response headers
export const addServiceStatusHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Database-Status', serviceCache.database.isAvailable ? 'available' : 'unavailable');
  res.setHeader('X-S3-Status', serviceCache.s3.isAvailable ? 'available' : 'unavailable');
  
  next();
};

// Circuit breaker pattern for external service calls
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000 // 1 minute
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        type: 'circuit_breaker',
        message: 'Circuit breaker opened due to repeated failures',
        failureCount: this.failureCount,
        alert: true,
        severity: 'critical',
      }));
    }
  }
  
  getState(): string {
    return this.state;
  }
}

// Export circuit breakers for different services
export const databaseCircuitBreaker = new CircuitBreaker(5, 60000);
export const s3CircuitBreaker = new CircuitBreaker(3, 30000);