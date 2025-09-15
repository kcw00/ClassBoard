import { Router, Request, Response, NextFunction } from 'express';
import { noteService } from '../services/noteService';
import { authenticateToken } from '../middleware/auth';
import {
  validateCreateNoteRequest,
  validateUpdateNoteRequest,
  validateNoteIdParam,
  validateGetNotesQuery
} from '../validators/noteValidators';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/class-notes
 * @desc    Get all class notes with optional filtering
 * @access  Private
 */
router.get(
  '/',
  validateGetNotesQuery,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        classId,
        date,
        dateFrom,
        dateTo,
        topics,
        search,
        page = 1,
        limit = 10
      } = req.query;

      const filters: any = {};
      if (classId) filters.classId = classId as string;
      if (date) filters.date = date as string;
      if (dateFrom) filters.dateFrom = dateFrom as string;
      if (dateTo) filters.dateTo = dateTo as string;
      if (search) filters.search = search as string;
      
      // Handle topics parameter (can be string or array)
      if (topics) {
        if (Array.isArray(topics)) {
          filters.topics = topics as string[];
        } else {
          filters.topics = [topics as string];
        }
      }

      const result = await noteService.getNotes(filters, {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: 'Class notes retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/class-notes
 * @desc    Create a new class note
 * @access  Private
 */
router.post(
  '/',
  validateCreateNoteRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const note = await noteService.createNote(req.body);
      res.status(201).json({
        success: true,
        data: note,
        message: 'Class note created successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/class-notes/:id
 * @desc    Get a specific class note by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateNoteIdParam,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const note = await noteService.getNoteById(req.params.id);
      
      if (!note) {
        res.status(404).json({
          success: false,
          message: 'Class note not found'
        });
        return;
      }

      res.json({
        success: true,
        data: note,
        message: 'Class note retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PUT /api/class-notes/:id
 * @desc    Update a class note
 * @access  Private
 */
router.put(
  '/:id',
  validateUpdateNoteRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const note = await noteService.updateNote(req.params.id, req.body);
      
      res.json({
        success: true,
        data: note,
        message: 'Class note updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   DELETE /api/class-notes/:id
 * @desc    Delete a class note
 * @access  Private
 */
router.delete(
  '/:id',
  validateNoteIdParam,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await noteService.deleteNote(req.params.id);
      
      res.json({
        success: true,
        message: 'Class note deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;