import type { Request, Response } from 'express';
import { ActivityLog } from '../models/ActivityLog.ts';

/**
 * Activity Controller - Provides admin access to all system activity logs
 */

/**
 * Get recent activity logs with pagination
 * GET /api/activity
 */
export const getRecentActivity = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      ActivityLog.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments()
    ]);

    res.json({
      success: true,
      data: activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch activity logs',
      error: error.message 
    });
  }
};

/**
 * Get activity by specific user
 * GET /api/activity/user/:userId
 */
export const getActivityByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      ActivityLog.find({ actor: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments({ actor: userId })
    ]);

    res.json({
      success: true,
      data: activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user activity',
      error: error.message 
    });
  }
};

/**
 * Search activity logs with filters
 * GET /api/activity/search
 * Query params: action, targetModel, startDate, endDate, actorModel
 */
export const searchActivity = async (req: Request, res: Response) => {
  try {
    const { action, targetModel, startDate, endDate, actorModel } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    
    if (action) filter.action = action;
    if (targetModel) filter.targetModel = targetModel;
    if (actorModel) filter.actorModel = actorModel;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    const [activities, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: activities,
      filters: { action, targetModel, startDate, endDate, actorModel },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error searching activity logs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to search activity logs',
      error: error.message 
    });
  }
};

/**
 * Get activity statistics for dashboard
 * GET /api/activity/stats
 */
export const getActivityStats = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      totalToday,
      totalWeek,
      byAction,
      byActorModel
    ] = await Promise.all([
      ActivityLog.countDocuments({ createdAt: { $gte: today } }),
      ActivityLog.countDocuments({ createdAt: { $gte: weekAgo } }),
      ActivityLog.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      ActivityLog.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        { $group: { _id: '$actorModel', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalToday,
        totalWeek,
        topActions: byAction,
        byRole: byActorModel
      }
    });
  } catch (error: any) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch activity stats',
      error: error.message 
    });
  }
};
