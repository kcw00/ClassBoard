import { Router, Request, Response, NextFunction } from 'express';
import assessmentService from '../services/assessmentService';
import { authenticateToken } from '../middleware/auth';
import {
  validateCreateTestRequest,
  validateUpdateTestRequest,
  validateCreateTestResultRequest,
  validateUpdateTestResultRequest,
  validateCreateHomeworkRequest,
  validateUpdateHomeworkRequest,
  validateCreateHomeworkSubmissionRequest,
  validateUpdateHomeworkSubmissionRequest,
  validateTestIdParam,
  validateHomeworkIdParam,
  validateClassIdParam,
  validateStudentIdParam,
  validateTestResultParams,
  validateHomeworkSubmissionParams,
  validateGetTestsQuery,
  validateGetHomeworkQuery,
  validateAssignmentIdParam,
} from '../validators/assessmentValidators';

const router = Router();

// TEST ROUTES

/**
 * GET /api/tests
 * Get all tests across all classes with pagination
 */
router.get('/tests', authenticateToken, validateGetTestsQuery, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query as any;
    const result = await assessmentService.getAllTests(query);

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
 * GET /api/classes/:classId/tests
 * Get all tests for a class with pagination
 */
router.get('/classes/:classId/tests', authenticateToken, validateClassIdParam, validateGetTestsQuery, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId } = req.params;
    const query = req.query as any;
    const result = await assessmentService.getTestsByClass(classId, query);

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
 * GET /api/tests/:id
 * Get a single test by ID with results
 */
router.get('/tests/:id', authenticateToken, validateTestIdParam, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const test = await assessmentService.getTestById(id);

    res.json({
      success: true,
      data: test,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tests
 * Create a new test
 */
router.post('/tests', authenticateToken, validateCreateTestRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const testData = req.body;
    const newTest = await assessmentService.createTest(testData);

    res.status(201).json({
      success: true,
      data: newTest,
      message: 'Test created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/tests/:id
 * Update an existing test
 */
router.put('/tests/:id', authenticateToken, validateTestIdParam, validateUpdateTestRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedTest = await assessmentService.updateTest(id, updates);

    res.json({
      success: true,
      data: updatedTest,
      message: 'Test updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/tests/:id
 * Delete a test
 */
router.delete('/tests/:id', authenticateToken, validateTestIdParam, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await assessmentService.deleteTest(id);

    res.json({
      success: true,
      message: 'Test deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// TEST RESULT ROUTES

/**
 * GET /api/test-results
 * Get all test results across all tests with pagination
 */
router.get('/test-results', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query as any;
    const result = await assessmentService.getAllTestResults(query);

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
 * GET /api/tests/:testId/results
 * Get all results for a specific test
 */
router.get('/tests/:testId/results', authenticateToken, validateTestIdParam, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { testId } = req.params;
    const results = await assessmentService.getTestResults(testId);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/test-results
 * Create or update a test result
 */
router.post('/test-results', authenticateToken, validateCreateTestResultRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resultData = req.body;
    const result = await assessmentService.createOrUpdateTestResult(resultData);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Test result saved successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/tests/:testId/results/:studentId
 * Update a specific test result
 */
router.put('/tests/:testId/results/:studentId', authenticateToken, validateTestResultParams, validateUpdateTestResultRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { testId, studentId } = req.params;
    const updates = req.body;
    const updatedResult = await assessmentService.updateTestResult(testId, studentId, updates);

    res.json({
      success: true,
      data: updatedResult,
      message: 'Test result updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/tests/:testId/results/:studentId
 * Delete a test result
 */
router.delete('/tests/:testId/results/:studentId', authenticateToken, validateTestResultParams, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { testId, studentId } = req.params;
    await assessmentService.deleteTestResult(testId, studentId);

    res.json({
      success: true,
      message: 'Test result deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// HOMEWORK ASSIGNMENT ROUTES

/**
 * GET /api/homework-assignments
 * Get all homework assignments across all classes with pagination
 */
router.get('/homework-assignments', authenticateToken, validateGetHomeworkQuery, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query as any;
    const result = await assessmentService.getAllHomework(query);

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
 * GET /api/classes/:classId/homework
 * Get all homework assignments for a class with pagination
 */
router.get('/classes/:classId/homework', authenticateToken, validateClassIdParam, validateGetHomeworkQuery, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId } = req.params;
    const query = req.query as any;
    const result = await assessmentService.getHomeworkByClass(classId, query);

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
 * GET /api/homework/:id
 * Get a single homework assignment by ID with submissions
 */
router.get('/homework/:id', authenticateToken, validateHomeworkIdParam, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const homework = await assessmentService.getHomeworkById(id);

    res.json({
      success: true,
      data: homework,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/homework
 * Create a new homework assignment
 */
router.post('/homework', authenticateToken, validateCreateHomeworkRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const homeworkData = req.body;
    const newHomework = await assessmentService.createHomework(homeworkData);

    res.status(201).json({
      success: true,
      data: newHomework,
      message: 'Homework assignment created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/homework/:id
 * Update an existing homework assignment
 */
router.put('/homework/:id', authenticateToken, validateHomeworkIdParam, validateUpdateHomeworkRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedHomework = await assessmentService.updateHomework(id, updates);

    res.json({
      success: true,
      data: updatedHomework,
      message: 'Homework assignment updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/homework/:id
 * Delete a homework assignment
 */
router.delete('/homework/:id', authenticateToken, validateHomeworkIdParam, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await assessmentService.deleteHomework(id);

    res.json({
      success: true,
      message: 'Homework assignment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// HOMEWORK SUBMISSION ROUTES

/**
 * GET /api/homework-submissions
 * Get all homework submissions across all assignments with pagination
 */
router.get('/homework-submissions', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query as any;
    const result = await assessmentService.getAllHomeworkSubmissions(query);

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
 * GET /api/homework/:assignmentId/submissions
 * Get all submissions for a specific homework assignment
 */
router.get('/homework/:assignmentId/submissions', authenticateToken, validateAssignmentIdParam, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assignmentId } = req.params;
    const submissions = await assessmentService.getHomeworkSubmissions(assignmentId);

    res.json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/homework-submissions
 * Create or update a homework submission
 */
router.post('/homework-submissions', authenticateToken, validateCreateHomeworkSubmissionRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const submissionData = req.body;
    const submission = await assessmentService.createOrUpdateHomeworkSubmission(submissionData);

    res.status(201).json({
      success: true,
      data: submission,
      message: 'Homework submission saved successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/homework/:assignmentId/submissions/:studentId
 * Update a specific homework submission (typically for grading)
 */
router.put('/homework/:assignmentId/submissions/:studentId', authenticateToken, validateHomeworkSubmissionParams, validateUpdateHomeworkSubmissionRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assignmentId, studentId } = req.params;
    const updates = req.body;
    const updatedSubmission = await assessmentService.updateHomeworkSubmission(assignmentId, studentId, updates);

    res.json({
      success: true,
      data: updatedSubmission,
      message: 'Homework submission updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/homework/:assignmentId/submissions/:studentId
 * Delete a homework submission
 */
router.delete('/homework/:assignmentId/submissions/:studentId', authenticateToken, validateHomeworkSubmissionParams, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assignmentId, studentId } = req.params;
    await assessmentService.deleteHomeworkSubmission(assignmentId, studentId);

    res.json({
      success: true,
      message: 'Homework submission deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// STUDENT ASSESSMENT OVERVIEW ROUTES

/**
 * GET /api/classes/:classId/students/:studentId/assessments
 * Get all assessments (tests and homework) for a specific student in a class
 */
router.get('/classes/:classId/students/:studentId/assessments', authenticateToken, validateClassIdParam, validateStudentIdParam, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId, studentId } = req.params;
    const assessments = await assessmentService.getStudentSubmissions(classId, studentId);

    res.json({
      success: true,
      data: assessments,
    });
  } catch (error) {
    next(error);
  }
});

export default router;