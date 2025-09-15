import { Router, Request, Response, NextFunction } from 'express';
import studentService from '../services/studentService';
import { authenticateToken } from '../middleware/auth';
import {
  validateCreateStudentRequest,
  validateUpdateStudentRequest,
  validateStudentIdParam,
  validateGetStudentsQuery,
  validateSearchStudentsQuery,
} from '../validators/studentValidators';
import { AppError } from '../utils/errors';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * GET /api/students
 * Get all students with enrollment information (paginated)
 * Query params: page, limit, grade, search
 */
router.get('/', validateGetStudentsQuery, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query as any;
    const result = await studentService.getAllStudentsPaginated(query);
    
    // Transform data to match frontend expectations
    const transformedStudents = result.data.map(student => ({
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      grade: student.grade,
      parentContact: student.parentContact,
      enrollmentDate: student.enrollmentDate,
      enrolledClasses: student.enrollments.map(enrollment => enrollment.class.id),
      enrollmentCount: student._count.enrollments,
      classes: student.enrollments.map(enrollment => enrollment.class),
    }));

    res.json({
      success: true,
      data: transformedStudents,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/students/search
 * Search students by name, email, phone, or grade
 * Query params: q (search query), limit
 */
router.get('/search', validateSearchStudentsQuery, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q: searchTerm, limit } = req.query as any;
    const students = await studentService.searchStudents(searchTerm, limit);

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/students/:id
 * Get a single student by ID with enrollment information
 */
router.get('/:id', validateStudentIdParam, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const student = await studentService.getStudentById(id);
    
    // Transform data to match frontend expectations
    const transformedStudent = {
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      grade: student.grade,
      parentContact: student.parentContact,
      enrollmentDate: student.enrollmentDate,
      enrolledClasses: student.enrollments.map(enrollment => enrollment.class.id),
      enrollmentCount: student._count.enrollments,
      classes: student.enrollments.map(enrollment => enrollment.class),
    };

    res.json({
      success: true,
      data: transformedStudent,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/students
 * Create a new student
 */
router.post('/', validateCreateStudentRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentData = req.body;
    const newStudent = await studentService.createStudent(studentData);
    
    // Transform data to match frontend expectations
    const transformedStudent = {
      id: newStudent.id,
      name: newStudent.name,
      email: newStudent.email,
      phone: newStudent.phone,
      grade: newStudent.grade,
      parentContact: newStudent.parentContact,
      enrollmentDate: newStudent.enrollmentDate,
      enrolledClasses: [],
      enrollmentCount: 0,
      classes: [],
    };

    res.status(201).json({
      success: true,
      data: transformedStudent,
      message: 'Student created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/students/:id
 * Update an existing student
 */
router.put('/:id', validateStudentIdParam, validateUpdateStudentRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Use optimized method that returns updated student with enrollments in one query
    const studentWithEnrollments = await studentService.updateStudentWithEnrollments(id, updates);
    
    // Transform data to match frontend expectations
    const transformedStudent = {
      id: studentWithEnrollments.id,
      name: studentWithEnrollments.name,
      email: studentWithEnrollments.email,
      phone: studentWithEnrollments.phone,
      grade: studentWithEnrollments.grade,
      parentContact: studentWithEnrollments.parentContact,
      enrollmentDate: studentWithEnrollments.enrollmentDate,
      enrolledClasses: studentWithEnrollments.enrollments.map(enrollment => enrollment.class.id),
      enrollmentCount: studentWithEnrollments._count.enrollments,
      classes: studentWithEnrollments.enrollments.map(enrollment => enrollment.class),
    };

    res.json({
      success: true,
      data: transformedStudent,
      message: 'Student updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/students/:id
 * Delete a student
 */
router.delete('/:id', validateStudentIdParam, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await studentService.deleteStudent(id);

    res.json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/students/:id/classes
 * Get classes that a student is enrolled in
 */
router.get('/:id/classes', validateStudentIdParam, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const classes = await studentService.getStudentClasses(id);

    res.json({
      success: true,
      data: classes,
    });
  } catch (error) {
    next(error);
  }
});

export default router;