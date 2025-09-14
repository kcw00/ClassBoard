import { Router } from 'express';
import authRoutes from './auth';
import classRoutes from './classes';
import studentRoutes from './students';
import scheduleRoutes from './schedules';
import assessmentRoutes from './assessments';
import fileRoutes from './files';
import attendanceRoutes from './attendance';
import meetingRoutes from './meetings';

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

// API info endpoint (must be before root-level route mounting)
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
      schedules: '/api/schedules',
      tests: '/api/tests',
      homework: '/api/homework',
      files: '/api/files',
      attendance: '/api/attendance',
      meetings: '/api/meetings',
    },
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/classes', classRoutes);
router.use('/students', studentRoutes);
router.use('/', scheduleRoutes); // Schedule routes are mounted at root level for flexibility
router.use('/', assessmentRoutes); // Assessment routes are mounted at root level for flexibility
router.use('/files', fileRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/meetings', meetingRoutes);

export default router;