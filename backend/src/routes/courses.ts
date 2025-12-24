import express from 'express';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  toggleCourseStatus,
  deleteCourse,
  getCourseStatistics
} from '../controllers/courseController.ts';
import { requireAuth, requireRole } from '../middleware/session.ts';

const router = express.Router();

// Public routes (authenticated users)
router.get('/', requireAuth, getCourses);
router.get('/statistics', requireAuth, getCourseStatistics);
router.get('/:id', requireAuth, getCourseById);

//Admin-only routes
router.post('/', requireAuth, requireRole('superadmin'), createCourse);
router.patch('/:id', requireAuth, requireRole('superadmin'), updateCourse);
router.patch('/:id/toggle-status', requireAuth, requireRole('superadmin'), toggleCourseStatus);
router.delete('/:id', requireAuth, requireRole('superadmin'), deleteCourse);

export default router;
