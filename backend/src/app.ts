import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import config from './config';
import corsMiddleware from './middleware/cors';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { 
  requestIdMiddleware, 
  requestLoggingMiddleware, 
  performanceMonitoringMiddleware 
} from './middleware/logging';
import { addServiceStatusHeaders } from './middleware/serviceAvailability';
import { 
  apiMonitoringMiddleware,
  databaseMonitoringMiddleware,
  authMonitoringMiddleware,
  fileMonitoringMiddleware
} from './middleware/monitoring';
import routes from './routes';
import healthRoutes from './routes/health';

const app = express();

// Request ID and timing middleware (must be first)
app.use(requestIdMiddleware);

// Security middleware
app.use(helmet());

// CORS middleware
app.use(corsMiddleware);

// Rate limiting
app.use(generalLimiter);

// Compression middleware
app.use(compression());

// Enhanced logging middleware
app.use(requestLoggingMiddleware);
app.use(performanceMonitoringMiddleware);

// Monitoring middleware
app.use(apiMonitoringMiddleware);
app.use(databaseMonitoringMiddleware);
app.use(authMonitoringMiddleware);
app.use(fileMonitoringMiddleware);

// Service status headers
app.use(addServiceStatusHeaders);

// Traditional logging middleware (for compatibility)
if (config.server.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check routes (before API routes for priority)
app.use('/api', healthRoutes);

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;