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
 * Returns JSON 401 for API routes, redirects to login for page routes
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId) {
    return next();
  }
  
  // For API routes, return JSON error instead of redirect
  if (req.path.startsWith('/api') || req.originalUrl.startsWith('/api')) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Authentication required. Please log in.'
    });
  }
  
  // For page routes, redirect to login
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
 * Returns JSON for API routes, renders HTML/redirects for page routes
 */
export function requireRole(...roles: Array<'student' | 'teacher' | 'superadmin'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const isApiRoute = req.path.startsWith('/api') || req.originalUrl.startsWith('/api');
    
    if (!req.session || !req.session.userId) {
      if (isApiRoute) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Authentication required. Please log in.'
        });
      }
      return res.redirect('/login');
    }
    
    if (!req.session.role || !roles.includes(req.session.role)) {
      if (isApiRoute) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'You do not have permission to access this resource'
        });
      }
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
