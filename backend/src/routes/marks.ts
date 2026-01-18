import { Router } from 'express';
import { requireAdmin, requireTeacher, requireAuth } from '../middleware/roleAuth.ts';
import {
  getAllMarks,
  addMarks,
  addBulkMarks,
  getMarksByStudent,
  updateMarks,
  getMarksReport
} from '../controllers/marksController.ts';

const router = Router();

/**
 * Marks/Grades Routes
 * Teachers can add/update, Admin can view all and reports
 */

// Admin only - View all marks
router.get('/', requireAdmin, getAllMarks);

// Admin only - Get marks report
router.get('/report', requireAdmin, getMarksReport);

// Teacher/Admin - Add marks
router.post('/', requireTeacher, addMarks);

// Teacher/Admin - Bulk add marks
router.post('/bulk', requireTeacher, addBulkMarks);

// Any authenticated user - Get student's marks
router.get('/student/:studentId', requireAuth, getMarksByStudent);

// Teacher/Admin - Update marks
router.put('/:id', requireTeacher, updateMarks);

export default router;
