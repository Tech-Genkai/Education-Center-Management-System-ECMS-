import express from 'express';
import {
  getSemestersByCourse,
  getSemesterById,
  assignSubjectTeacher,
  removeSubjectTeacher,
  updateTeacherAssignment,
  getTeacherWorkload,
  deleteSemester
} from '../controllers/semesterController.ts';
import { requireAuth, requireRole } from '../middleware/session.ts';

const router = express.Router();

// Public routes (authenticated users)
router.get('/course/:courseId', requireAuth, getSemestersByCourse);
router.get('/:id', requireAuth, getSemesterById);
router.get('/teacher/:teacherId/workload', requireAuth, getTeacherWorkload);

// Admin-only routes
router.post('/:id/assign', requireAuth, requireRole('superadmin'), assignSubjectTeacher);
router.patch('/:semesterId/assignment/:assignmentId', requireAuth, requireRole('superadmin'), updateTeacherAssignment);
router.delete('/:semesterId/assignment/:assignmentId', requireAuth, requireRole('superadmin'), removeSubjectTeacher);
router.delete('/:id', requireAuth, requireRole('superadmin'), deleteSemester);

export default router;
