import type { Request, Response, NextFunction } from 'express';
import { ActivityLog } from '../models/ActivityLog.ts';

/**
 * Role-based authentication middleware
 * Provides access control and activity logging for all API operations
 */

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        role: 'admin' | 'teacher' | 'student';
        name: string;
        email: string;
      };
    }
  }
}

/**
 * Extract user from session
 */
const getUserFromSession = (req: Request) => {
  const session = req.session as any;
  if (!session?.user) return null;
  
  return {
    _id: session.user._id || session.user.id,
    role: session.user.role,
    name: session.user.name || session.user.firstName + ' ' + (session.user.lastName || ''),
    email: session.user.email
  };
};

/**
 * Middleware: Require authenticated user
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const user = getUserFromSession(req);
  
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  
  req.user = user;
  next();
};

/**
 * Middleware: Require Admin role
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = getUserFromSession(req);
  
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  
  if (user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
  
  req.user = user;
  next();
};

/**
 * Middleware: Require Teacher or Admin role
 */
export const requireTeacher = (req: Request, res: Response, next: NextFunction) => {
  const user = getUserFromSession(req);
  
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  
  if (user.role !== 'admin' && user.role !== 'teacher') {
    return res.status(403).json({ 
      success: false, 
      message: 'Teacher or Admin access required' 
    });
  }
  
  req.user = user;
  next();
};

/**
 * Middleware: Require Student, Teacher, or Admin role (any authenticated user)
 */
export const requireStudent = (req: Request, res: Response, next: NextFunction) => {
  const user = getUserFromSession(req);
  
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  
  req.user = user;
  next();
};

/**
 * Helper function to log activity (can be called from controllers)
 */
export const logActivity = async (params: {
  actor: string;
  actorModel: 'SuperAdmin' | 'Teacher' | 'Student';
  actorName: string;
  actorEmail?: string;
  action: string;
  targetModel: string;
  targetId?: string;
  targetDescription?: string;
  details?: any;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  status?: 'success' | 'failed' | 'pending';
  errorMessage?: string;
}) => {
  try {
    await ActivityLog.create(params);
  } catch (error) {
    // Log error but don't fail the main operation
    console.error('Failed to log activity:', error);
  }
};

/**
 * Get actor model name from role
 */
export const getActorModel = (role: string): 'SuperAdmin' | 'Teacher' | 'Student' => {
  switch (role) {
    case 'admin': return 'SuperAdmin';
    case 'teacher': return 'Teacher';
    case 'student': return 'Student';
    default: return 'Student';
  }
};
