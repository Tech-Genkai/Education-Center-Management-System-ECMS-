import express from 'express';
import { requireAuth, requireRole } from '../middleware/session.ts';
import {
  createSuperAdmin,
  getSuperAdmins,
  getSuperAdminById,
  updateSuperAdmin,
  deleteSuperAdmin,
  updatePermissions,
  updateAccessLevel,
  toggleMFA,
  updateLastLogin
} from '../controllers/superAdminController.ts';

const router = express.Router();

// All routes require authentication and superadmin role
router.use(requireAuth);
router.use(requireRole('superadmin'));

/**
 * @route   POST /api/superadmins
 * @desc    Create a new SuperAdmin profile
 * @access  Private (superadmin only)
 */
router.post('/', createSuperAdmin);

/**
 * @route   GET /api/superadmins
 * @desc    Get all SuperAdmin profiles with pagination and filtering
 * @access  Private (superadmin only)
 * @query   page, limit, status, accessLevel, search
 */
router.get('/', getSuperAdmins);

/**
 * @route   GET /api/superadmins/:id
 * @desc    Get a single SuperAdmin profile by ID
 * @access  Private (superadmin only)
 */
router.get('/:id', getSuperAdminById);

/**
 * @route   PUT /api/superadmins/:id
 * @desc    Update a SuperAdmin profile
 * @access  Private (superadmin only)
 */
router.put('/:id', updateSuperAdmin);

/**
 * @route   DELETE /api/superadmins/:id
 * @desc    Delete a SuperAdmin profile (soft delete by default)
 * @access  Private (superadmin only)
 * @query   hard=true for permanent deletion
 */
router.delete('/:id', deleteSuperAdmin);

/**
 * @route   PUT /api/superadmins/:id/permissions
 * @desc    Update SuperAdmin permissions array
 * @access  Private (superadmin only)
 */
router.put('/:id/permissions', updatePermissions);

/**
 * @route   PUT /api/superadmins/:id/access-level
 * @desc    Update SuperAdmin access level
 * @access  Private (superadmin only)
 */
router.put('/:id/access-level', updateAccessLevel);

/**
 * @route   PUT /api/superadmins/:id/mfa
 * @desc    Toggle MFA for a SuperAdmin
 * @access  Private (superadmin only)
 */
router.put('/:id/mfa', toggleMFA);

/**
 * @route   PUT /api/superadmins/:id/last-login
 * @desc    Update last login timestamp
 * @access  Private (superadmin only)
 */
router.put('/:id/last-login', updateLastLogin);

/**
 * @route   PATCH /api/superadmins/:id/toggle-status
 * @desc    Toggle admin active/inactive status
 * @access  Private (superadmin only)
 */
router.patch('/:id/toggle-status', async (req, res, next) => {
  try {
    const { NotFoundError } = await import('../middleware/errorHandler.ts');
    const { SuperAdmin } = await import('../models/SuperAdmin.ts');
    const { User } = await import('../models/User.ts');
    
    const admin = await SuperAdmin.findById(req.params.id);
    if (!admin) throw new NotFoundError('Admin', req.params.id);
    
    const newStatus = admin.status === 'active' ? 'inactive' : 'active';
    admin.status = newStatus;
    await admin.save();
    
    const user = await User.findById(admin.userId);
    if (user) {
      user.isActive = newStatus === 'active';
      await user.save();
    }
    
    res.json({ message: `Admin ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`, admin });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/superadmins/:id/reset-password
 * @desc    Reset admin password
 * @access  Private (superadmin only)
 */
router.post('/:id/reset-password', async (req, res, next) => {
  try {
    const { NotFoundError, ValidationError } = await import('../middleware/errorHandler.ts');
    const { SuperAdmin } = await import('../models/SuperAdmin.ts');
    const { User } = await import('../models/User.ts');
    
    const admin = await SuperAdmin.findById(req.params.id);
    if (!admin) throw new NotFoundError('Admin', req.params.id);
    
    const { password } = req.body;
    if (!password || password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }
    
    const user = await User.findById(admin.userId);
    if (!user) throw new NotFoundError('User account for admin');
    
    user.password = password;
    await user.save();
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/superadmins/:id/send-reset-email
 * @desc    Send password reset email with OTP to admin
 * @access  Private (superadmin only)
 */
router.post('/:id/send-reset-email', async (req, res, next) => {
  try {
    const { NotFoundError } = await import('../middleware/errorHandler.ts');
    const { SuperAdmin } = await import('../models/SuperAdmin.ts');
    const { User } = await import('../models/User.ts');
    const { PasswordReset } = await import('../models/PasswordReset.ts');
    const crypto = await import('crypto');
    const { emailService } = await import('../services/emailService.ts');
    
    const admin = await SuperAdmin.findById(req.params.id);
    if (!admin) throw new NotFoundError('Admin', req.params.id);
    
    const user = await User.findById(admin.userId);
    if (!user) throw new NotFoundError('User account for admin');
    
    // Generate OTP and reset token
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const resetToken = crypto.default.randomBytes(32).toString('hex');
    
    // Store in database
    await PasswordReset.create({
      userId: user._id,
      email: user.email,
      otp,
      resetToken,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      isUsed: false,
      attempts: 0
    });
    
    // Send email
    await emailService.sendOTPEmail(user.email, otp);
    
    res.json({ message: 'Password reset email sent successfully', email: user.email });
  } catch (error) {
    next(error);
  }
});

export default router;
