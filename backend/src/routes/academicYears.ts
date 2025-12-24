import express from 'express';
import {
  getAcademicYears,
  getCurrentAcademicYear,
  getAcademicYearById,
  createAcademicYear,
  updateAcademicYear,
  setCurrentYear,
  deleteAcademicYear
} from '../controllers/academicYearController.ts';
import { requireAuth, requireRole } from '../middleware/session.ts';

const router = express.Router();

// Public routes (authenticated users)
router.get('/', requireAuth, getAcademicYears);
router.get('/current', requireAuth, getCurrentAcademicYear);
router.get('/:id', requireAuth, getAcademicYearById);

// Admin-only routes
router.post('/', requireAuth, requireRole('superadmin'), createAcademicYear);
router.patch('/:id', requireAuth, requireRole('superadmin'), updateAcademicYear);
router.patch('/:id/set-current', requireAuth, requireRole('superadmin'), setCurrentYear);
router.delete('/:id', requireAuth, requireRole('superadmin'), deleteAcademicYear);

export default router;
