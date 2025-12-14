import type { Request, Response, NextFunction } from 'express';

// Extend Express Session to include our custom properties
declare module 'express-session' {
  interface SessionData {
    userId: string;
    email: string;
    role: 'student' | 'teacher' | 'superadmin';
  }
}

/**
 * Middleware to check if user is authenticated
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId) {
    return next();
  }
  res.redirect('/login');
}

/**
 * Middleware to check if user is already authenticated (for login page)
 */
export function redirectIfAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId) {
    const role = req.session.role === 'superadmin' ? 'admin' : req.session.role;
    return res.redirect(`/${role}/dashboard`);
  }
  next();
}

/**
 * Middleware to check role authorization
 */
export function requireRole(...roles: Array<'student' | 'teacher' | 'superadmin'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session || !req.session.userId) {
      return res.redirect('/login');
    }
    
    if (!roles.includes(req.session.role)) {
      return res.status(403).render('errors/error', {
        status: 403,
        title: 'Access Denied',
        message: 'You do not have permission to access this page',
        error: null
      });
    }
    
    next();
  };
}

/**
 * Middleware to attach user session to response locals
 */
export function attachUserToLocals(req: Request, res: Response, next: NextFunction) {
  res.locals.user = req.session || null;
  res.locals.isAuthenticated = !!(req.session && req.session.userId);
  next();
}
