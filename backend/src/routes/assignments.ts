import { Router } from 'express';
import { requireAdmin, requireTeacher, requireStudent } from '../middleware/roleAuth.ts';
import {
  getAllAssignments,
  createAssignment,
  getAssignmentsByClass,
  getAssignmentsByTeacher,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmissions,
  gradeSubmission
} from '../controllers/assignmentController.ts';

const router = Router();

/**
 * Assignment Routes
 * Teachers create/manage, Students submit, Admin views all
 */

// Admin only - View all assignments
router.get('/', requireAdmin, getAllAssignments);

// Teacher/Admin - Create assignment
router.post('/', requireTeacher, createAssignment);

// Teacher/Admin - Get assignments by class
router.get('/class/:classId', requireTeacher, getAssignmentsByClass);

// Teacher/Admin - Get teacher's assignments
router.get('/teacher/:teacherId', requireTeacher, getAssignmentsByTeacher);

// Teacher/Admin - Update assignment
router.put('/:id', requireTeacher, updateAssignment);

// Teacher/Admin - Delete assignment
router.delete('/:id', requireTeacher, deleteAssignment);

// Student - Submit assignment
router.post('/:id/submit', requireStudent, submitAssignment);

// Teacher/Admin - Get submissions
router.get('/:id/submissions', requireTeacher, getSubmissions);

// Teacher/Admin - Grade a submission
router.post('/:id/submissions/:submissionId/grade', requireTeacher, gradeSubmission);

export default router;
