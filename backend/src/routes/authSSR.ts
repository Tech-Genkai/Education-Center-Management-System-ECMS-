import express, { type Request, type Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User.ts';
import { requireAuth, redirectIfAuth } from '../middleware/session.ts';

const router = express.Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  rememberMe: z.boolean().optional()
});

/**
 * GET /login - Show login page
 */
router.get('/login', redirectIfAuth, (req: Request, res: Response) => {
  const error = req.query.error as string;
  res.render('login', {
    title: 'Login - ECMS',
    error: error || null,
    savedEmail: req.cookies.savedEmail || ''
  });
});

/**
 * POST /login - Handle login form submission
 */
router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  
  if (!parsed.success) {
    return res.render('login', {
      title: 'Login - ECMS',
      error: 'Invalid email or password',
      savedEmail: req.body.email || ''
    });
  }

  const { email, password, rememberMe } = parsed.data;

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim(), isActive: true });
    
    if (!user) {
      return res.render('login', {
        title: 'Login - ECMS',
        error: 'Invalid credentials',
        savedEmail: email
      });
    }

    const isValid = await user.comparePassword(password);
    
    if (!isValid) {
      return res.render('login', {
        title: 'Login - ECMS',
        error: 'Invalid credentials',
        savedEmail: email
      });
    }

    // Create session
    req.session.userId = user._id.toString();
    req.session.email = user.email;
    req.session.role = user.role;

    // Handle "Remember Me"
    if (rememberMe) {
      res.cookie('savedEmail', email, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
    } else {
      res.clearCookie('savedEmail');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Redirect to appropriate dashboard
    const role = user.role === 'superadmin' ? 'admin' : user.role;
    return res.redirect(`/${role}/dashboard`);
    
  } catch (err) {
    console.error('Login error:', err);
    return res.render('login', {
      title: 'Login - ECMS',
      error: 'Authentication failed. Please try again.',
      savedEmail: email
    });
  }
});

/**
 * GET /logout - Handle logout
 */
router.get('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
    }
    res.redirect('/login');
  });
});

/**
 * POST /logout - Handle logout (POST method for forms)
 */
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
    }
    res.redirect('/login');
  });
});

// Keep API endpoints for backward compatibility
router.post('/api/auth/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  const { email, password } = parsed.data;

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim(), isActive: true });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await user.comparePassword(password);
    
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // For API, still return token (but also create session)
    req.session.userId = user._id.toString();
    req.session.email = user.email;
    req.session.role = user.role;

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      user: {
        email: user.email,
        role: user.role,
        userId: user._id.toString()
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Authentication failed' });
  }
});

export default router;
