import { Router } from 'express';
import { requireAdmin, requireTeacher, requireAuth } from '../middleware/roleAuth.ts';
import {
  getAllAttendance,
  markAttendance,
  markBulkAttendance,
  getAttendanceByStudent,
  getAttendanceByClass,
  updateAttendance,
  getAttendanceStats
} from '../controllers/attendanceController.ts';

const router = Router();

/**
 * Attendance Routes
 * Role-based access control for all endpoints
 */

// Admin only - View all attendance
router.get('/', requireAdmin, getAllAttendance);

// Admin only - Get system-wide attendance stats
router.get('/stats', requireAdmin, getAttendanceStats);

// Teacher/Admin - Mark single attendance
router.post('/', requireTeacher, markAttendance);

// Teacher/Admin - Bulk mark attendance
router.post('/bulk', requireTeacher, markBulkAttendance);

// Any authenticated user - Get student's attendance
router.get('/student/:studentId', requireAuth, getAttendanceByStudent);

// Teacher/Admin - Get class attendance by date
router.get('/class/:classId', requireTeacher, getAttendanceByClass);

// Teacher/Admin - Update attendance record
router.put('/:id', requireTeacher, updateAttendance);

export default router;
