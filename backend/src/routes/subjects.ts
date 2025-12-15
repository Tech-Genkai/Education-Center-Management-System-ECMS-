import express from 'express';
import {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject
} from '../controllers/subjectController.ts';
import { requireAuth, requireRole } from '../middleware/session.ts';

const router = express.Router();

router.get('/', requireAuth, getSubjects);
router.get('/:id', requireAuth, getSubjectById);

router.post('/', requireAuth, requireRole('superadmin'), createSubject);
router.patch('/:id', requireAuth, requireRole('superadmin'), updateSubject);
router.delete('/:id', requireAuth, requireRole('superadmin'), deleteSubject);

export default router;
