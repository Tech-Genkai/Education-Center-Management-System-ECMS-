import express from 'express';
import { requireAuth, requireRole } from '../middleware/session.ts';
import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentMarks,
  getStudentAttendance
} from '../controllers/studentController.ts';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

/**
 * @route   GET /api/students
 * @desc    Get all students with pagination and filtering
 * @access  Private (superadmin, teacher)
 * @query   page, limit, status, class, search
 */
router.get('/', getStudents);

/**
 * @route   GET /api/students/:id
 * @desc    Get a single student by ID
 * @access  Private (superadmin, teacher, student-self)
 */
router.get('/:id', getStudentById);

/**
 * @route   POST /api/students
 * @desc    Create a new student
 * @access  Private (superadmin only)
 */
router.post('/', requireRole('superadmin'), createStudent);

/**
 * @route   PUT /api/students/:id
 * @desc    Update a student
 * @access  Private (superadmin only)
 */
router.put('/:id', requireRole('superadmin'), updateStudent);

/**
 * @route   DELETE /api/students/:id
 * @desc    Delete a student (soft delete by default)
 * @access  Private (superadmin only)
 * @query   hard=true for permanent deletion
 */
router.delete('/:id', requireRole('superadmin'), deleteStudent);

/**
 * @route   GET /api/students/:id/marks
 * @desc    Get student's marks
 * @access  Private (superadmin, teacher, student-self)
 */
router.get('/:id/marks', getStudentMarks);

/**
 * @route   GET /api/students/:id/attendance
 * @desc    Get student's attendance
 * @access  Private (superadmin, teacher, student-self)
 */
router.get('/:id/attendance', getStudentAttendance);

export default router;
