import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/roleAuth.ts';
import {
  getAllFees,
  createFee,
  getFeesByStudent,
  updateFee,
  recordPayment,
  getOverdueFees,
  getFeeStats
} from '../controllers/feeController.ts';

const router = Router();

/**
 * Fee Management Routes
 * Most endpoints are admin-only for financial security
 */

// Admin only - View all fees
router.get('/', requireAdmin, getAllFees);

// Admin only - Get fee statistics
router.get('/stats', requireAdmin, getFeeStats);

// Admin only - Get overdue fees report
router.get('/overdue', requireAdmin, getOverdueFees);

// Admin only - Create a fee
router.post('/', requireAdmin, createFee);

// Student can view their own, Admin can view any
router.get('/student/:studentId', requireAuth, getFeesByStudent);

// Admin only - Update fee record
router.put('/:id', requireAdmin, updateFee);

// Admin only - Record payment
router.post('/:id/payment', requireAdmin, recordPayment);

export default router;
