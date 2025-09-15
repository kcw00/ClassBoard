import { Router, Request, Response, NextFunction } from 'express';
import classService from '../services/classService';
import { authenticateToken } from '../middleware/auth';
import {
  validateCreateClassRequest,
  validateUpdateClassRequest,
  validateEnrollmentRequest,
  validateClassIdParam,
  validateStudentIdParam,
  validateGetClassesQuery,
} from '../validators/classValidators';
import { AppError } from '../utils/errors';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * GET /api/classes
 * Get all classes with enrollment information (paginated)
 * Query params: page, limit, subject, search
 */
router.get('/', validateGetClassesQuery, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query as any;
    const result = await classService.getAllClassesPaginated(query);
    
    // Transform data to match frontend expectations
    const transformedClasses = result.data.map(classData => ({
      id: classData.id,
      name: classData.name,
      subject: classData.subject,
      description: classData.description,
      room: classData.room,
      capacity: classData.capacity,
      color: classData.color,
      createdDate: classData.createdDate,
      enrolledStudents: classData.enrollments.map(enrollment => enrollment.studentId),
      enrollmentCount: classData._count.enrollments,
    }));

    res.json({
      success: true,
      data: transformedClasses,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/classes/:id
 * Get a single class by ID with enrollment information
 */
router.get('/:id', validateClassIdParam, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const classData = await classService.getClassById(id);
    
    // Transform data to match frontend expectations
    const transformedClass = {
      id: classData.id,
      name: classData.name,
      subject: classData.subject,
      description: classData.description,
      room: classData.room,
      capacity: classData.capacity,
      color: classData.color,
      createdDate: classData.createdDate,
      enrolledStudents: classData.enrollments.map(enrollment => enrollment.studentId),
      enrollmentCount: classData._count.enrollments,
      students: classData.enrollments.map(enrollment => enrollment.student),
    };

    res.json({
      success: true,
      data: transformedClass,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/classes
 * Create a new class
 */
router.post('/', validateCreateClassRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classData = req.body;
    const newClass = await classService.createClass(classData);
    
    // Transform data to match frontend expectations
    const transformedClass = {
      id: newClass.id,
      name: newClass.name,
      subject: newClass.subject,
      description: newClass.description,
      room: newClass.room,
      capacity: newClass.capacity,
      color: newClass.color,
      createdDate: newClass.createdDate,
      enrolledStudents: [],
      enrollmentCount: 0,
    };

    res.status(201).json({
      success: true,
      data: transformedClass,
      message: 'Class created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/classes/:id
 * Update an existing class
 */
router.put('/:id', validateClassIdParam, validateUpdateClassRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Use optimized method that returns updated class with enrollments in one query
    const classWithEnrollments = await classService.updateClassWithEnrollments(id, updates);
    
    // Transform data to match frontend expectations
    const transformedClass = {
      id: classWithEnrollments.id,
      name: classWithEnrollments.name,
      subject: classWithEnrollments.subject,
      description: classWithEnrollments.description,
      room: classWithEnrollments.room,
      capacity: classWithEnrollments.capacity,
      color: classWithEnrollments.color,
      createdDate: classWithEnrollments.createdDate,
      enrolledStudents: classWithEnrollments.enrollments.map(enrollment => enrollment.studentId),
      enrollmentCount: classWithEnrollments._count.enrollments,
    };

    res.json({
      success: true,
      data: transformedClass,
      message: 'Class updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/classes/:id
 * Delete a class
 */
router.delete('/:id', validateClassIdParam, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await classService.deleteClass(id);

    res.json({
      success: true,
      message: 'Class deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/classes/:id/enroll
 * Enroll a student in a class
 */
router.post('/:id/enroll', validateClassIdParam, validateEnrollmentRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: classId } = req.params;
    const { studentId } = req.body;
    
    await classService.enrollStudent(classId, studentId);

    res.json({
      success: true,
      message: 'Student enrolled successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/classes/:id/students/:studentId
 * Unenroll a student from a class
 */
router.delete('/:id/students/:studentId', validateClassIdParam, validateStudentIdParam, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: classId, studentId } = req.params;
    
    await classService.unenrollStudent(classId, studentId);

    res.json({
      success: true,
      message: 'Student unenrolled successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/classes/:id/students
 * Get students enrolled in a class
 */
router.get('/:id/students', validateClassIdParam, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const students = await classService.getClassStudents(id);

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    next(error);
  }
});

export default router;