import { Router, Request, Response, NextFunction } from 'express';
import scheduleService from '../services/scheduleService';
import { authenticateToken } from '../middleware/auth';
import {
  validateCreateScheduleRequest,
  validateUpdateScheduleRequest,
  validateCreateScheduleExceptionRequest,
  validateUpdateScheduleExceptionRequest,
  validateScheduleIdParam,
  validateClassIdParam,
  validateExceptionIdParam,
  validateGetSchedulesQuery,
  validateCreateSchedulesBulkRequest,
} from '../validators/scheduleValidators';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * GET /api/classes/:classId/schedules
 * Get all schedules for a specific class (paginated)
 * Query params: page, limit, dayOfWeek, search
 */
router.get('/classes/:classId/schedules', validateClassIdParam, validateGetSchedulesQuery, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId } = req.params;
    const query = req.query as any;
    const result = await scheduleService.getClassSchedulesPaginated(classId, query);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/classes/:classId/schedules
 * Create a new schedule for a class
 */
router.post('/classes/:classId/schedules', validateClassIdParam, validateCreateScheduleRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId } = req.params;
    const scheduleData = { ...req.body, classId };
    
    const newSchedule = await scheduleService.createSchedule(scheduleData);

    res.status(201).json({
      success: true,
      data: newSchedule,
      message: 'Schedule created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/schedules/:id
 * Get a single schedule by ID with exceptions
 */
router.get('/schedules/:id', validateScheduleIdParam, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const schedule = await scheduleService.getScheduleById(id);

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/schedules/:id
 * Update an existing schedule
 */
router.put('/schedules/:id', validateScheduleIdParam, validateUpdateScheduleRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedSchedule = await scheduleService.updateSchedule(id, updates);

    res.json({
      success: true,
      data: updatedSchedule,
      message: 'Schedule updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/schedules/:id
 * Delete a schedule
 */
router.delete('/schedules/:id', validateScheduleIdParam, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await scheduleService.deleteSchedule(id);

    res.json({
      success: true,
      message: 'Schedule deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/schedules/:id/exceptions
 * Get all exceptions for a specific schedule
 */
router.get('/schedules/:id/exceptions', validateScheduleIdParam, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const exceptions = await scheduleService.getScheduleExceptions(id);

    res.json({
      success: true,
      data: exceptions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/schedules/:id/exceptions
 * Create a new schedule exception
 */
router.post('/schedules/:id/exceptions', validateScheduleIdParam, validateCreateScheduleExceptionRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: scheduleId } = req.params;
    const exceptionData = { ...req.body, scheduleId };
    
    const newException = await scheduleService.createScheduleException(exceptionData);

    res.status(201).json({
      success: true,
      data: newException,
      message: 'Schedule exception created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/exceptions/:exceptionId
 * Update an existing schedule exception
 */
router.put('/exceptions/:exceptionId', validateExceptionIdParam, validateUpdateScheduleExceptionRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { exceptionId } = req.params;
    const updates = req.body;
    
    const updatedException = await scheduleService.updateScheduleException(exceptionId, updates);

    res.json({
      success: true,
      data: updatedException,
      message: 'Schedule exception updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/exceptions/:exceptionId
 * Delete a schedule exception
 */
router.delete('/exceptions/:exceptionId', validateExceptionIdParam, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { exceptionId } = req.params;
    await scheduleService.deleteScheduleException(exceptionId);

    res.json({
      success: true,
      message: 'Schedule exception deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;