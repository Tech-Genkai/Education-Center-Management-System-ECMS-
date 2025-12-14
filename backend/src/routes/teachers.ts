import express from 'express';
import { requireAuth, requireRole } from '../middleware/session.ts';
import {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  getTeacherClasses,
  getTeacherSubjects
} from '../controllers/teacherController.ts';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

/**
 * @route   GET /api/teachers
 * @desc    Get all teachers with pagination and filtering
 * @access  Private (superadmin, teacher)
 * @query   page, limit, status, department, search
 */
router.get('/', getTeachers);

/**
 * @route   GET /api/teachers/:id
 * @desc    Get a single teacher by ID
 * @access  Private (superadmin, teacher-self)
 */
router.get('/:id', getTeacherById);

/**
 * @route   POST /api/teachers
 * @desc    Create a new teacher
 * @access  Private (superadmin only)
 */
router.post('/', requireRole('superadmin'), createTeacher);

/**
 * @route   PUT /api/teachers/:id
 * @desc    Update a teacher
 * @access  Private (superadmin only)
 */
router.put('/:id', requireRole('superadmin'), updateTeacher);

/**
 * @route   DELETE /api/teachers/:id
 * @desc    Delete a teacher (soft delete by default)
 * @access  Private (superadmin only)
 * @query   hard=true for permanent deletion
 */
router.delete('/:id', requireRole('superadmin'), deleteTeacher);

/**
 * @route   GET /api/teachers/:id/classes
 * @desc    Get teacher's assigned classes
 * @access  Private (superadmin, teacher-self)
 */
router.get('/:id/classes', getTeacherClasses);

/**
 * @route   GET /api/teachers/:id/subjects
 * @desc    Get teacher's assigned subjects
 * @access  Private (superadmin, teacher-self)
 */
router.get('/:id/subjects', getTeacherSubjects);

export default router;
