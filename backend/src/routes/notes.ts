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
 * @route   POST /api/notes
 * @desc    Create a new note
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
        message: 'Note created successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/notes
 * @desc    Get all notes with optional filtering
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
        message: 'Notes retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/notes/recent
 * @desc    Get recent notes
 * @access  Private
 */
router.get(
  '/recent',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit = 10 } = req.query;
      const notes = await noteService.getRecentNotes(parseInt(limit as string));
      
      res.json({
        success: true,
        data: notes,
        message: 'Recent notes retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/notes/:id
 * @desc    Get a specific note by ID
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
          message: 'Note not found'
        });
        return;
      }

      res.json({
        success: true,
        data: note,
        message: 'Note retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PUT /api/notes/:id
 * @desc    Update a note
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
        message: 'Note updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   DELETE /api/notes/:id
 * @desc    Delete a note
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
        message: 'Note deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;