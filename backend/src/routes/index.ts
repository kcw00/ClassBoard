import { Router } from 'express';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ClassBoard API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to ClassBoard API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      classes: '/api/classes',
      students: '/api/students',
      tests: '/api/tests',
      files: '/api/files',
    },
  });
});

export default router;