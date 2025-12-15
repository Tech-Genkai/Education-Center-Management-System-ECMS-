import express from 'express';
import {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass
} from '../controllers/classController.ts';
import { requireAuth, requireRole } from '../middleware/session.ts';

const router = express.Router();

// Public/Shared routes (viewing classes might be allowed for teachers/students?)
// For now, let's strict restrict to authenticated users
router.get('/', requireAuth, getClasses);
router.get('/:id', requireAuth, getClassById);

// Admin only routes
router.post('/', requireAuth, requireRole('superadmin'), createClass);
router.patch('/:id', requireAuth, requireRole('superadmin'), updateClass);
router.delete('/:id', requireAuth, requireRole('superadmin'), deleteClass);

export default router;
