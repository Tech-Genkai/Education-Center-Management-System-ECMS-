import { Router } from 'express';
import { requireAdmin } from '../middleware/roleAuth.ts';
import {
  getRecentActivity,
  getActivityByUser,
  searchActivity,
  getActivityStats
} from '../controllers/activityController.ts';

const router = Router();

/**
 * Activity Log Routes - Admin Only
 * All routes require admin authentication
 */

// Get recent activity logs (paginated)
router.get('/', requireAdmin, getRecentActivity);

// Get activity statistics for dashboard
router.get('/stats', requireAdmin, getActivityStats);

// Search activity logs with filters
router.get('/search', requireAdmin, searchActivity);

// Get activity by specific user
router.get('/user/:userId', requireAdmin, getActivityByUser);

export default router;
