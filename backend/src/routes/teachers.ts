import express from 'express';
import { requireAuth, requireRole } from '../middleware/session.ts';
import {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  getTeacherClasses,
  getTeacherSubjects
} from '../controllers/teacherController.ts';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

/**
 * @route   GET /api/teachers
 * @desc    Get all teachers with pagination and filtering
 * @access  Private (superadmin, teacher)
 * @query   page, limit, status, department, search
 */
router.get('/', getTeachers);

/**
 * @route   GET /api/teachers/:id
 * @desc    Get a single teacher by ID
 * @access  Private (superadmin, teacher-self)
 */
router.get('/:id', getTeacherById);

/**
 * @route   POST /api/teachers
 * @desc    Create a new teacher
 * @access  Private (superadmin only)
 */
router.post('/', requireRole('superadmin'), createTeacher);

/**
 * @route   PUT /api/teachers/:id
 * @desc    Update a teacher
 * @access  Private (superadmin only)
 */
router.put('/:id', requireRole('superadmin'), updateTeacher);

/**
 * @route   DELETE /api/teachers/:id
 * @desc    Delete a teacher (soft delete by default)
 * @access  Private (superadmin only)
 * @query   hard=true for permanent deletion
 */
router.delete('/:id', requireRole('superadmin'), deleteTeacher);

/**
 * @route   GET /api/teachers/:id/classes
 * @desc    Get teacher's assigned classes
 * @access  Private (superadmin, teacher-self)
 */
router.get('/:id/classes', getTeacherClasses);

/**
 * @route   GET /api/teachers/:id/subjects
 * @desc    Get teacher's assigned subjects
 * @access  Private (superadmin, teacher-self)
 */
router.get('/:id/subjects', getTeacherSubjects);

/**
 * @route   PATCH /api/teachers/:id/toggle-status
 * @desc    Toggle teacher status (active/inactive)
 * @access  Private (superadmin only)
 */
router.patch('/:id/toggle-status', requireRole('superadmin'), async (req, res, next) => {
  try {
    const { NotFoundError } = await import('../middleware/errorHandler.ts');
    const { Teacher } = await import('../models/Teacher.ts');
    
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) throw new NotFoundError('Teacher', req.params.id);
    
    // Toggle status
    teacher.status = teacher.status === 'active' ? 'inactive' : 'active';
    await teacher.save();
    
    res.json({ 
      message: `Teacher ${teacher.status === 'active' ? 'activated' : 'deactivated'} successfully`,
      status: teacher.status 
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/teachers/:id/reset-password
 * @desc    Reset teacher password
 * @access  Private (superadmin only)
 */
router.post('/:id/reset-password', requireRole('superadmin'), async (req, res, next) => {
  try {
    const { NotFoundError, ValidationError } = await import('../middleware/errorHandler.ts');
    const { Teacher } = await import('../models/Teacher.ts');
    const { User } = await import('../models/User.ts');
    
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) throw new NotFoundError('Teacher', req.params.id);
    
    const { password } = req.body;
    if (!password || password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }
    
    const user = await User.findById(teacher.userId);
    if (!user) throw new NotFoundError('User account for teacher');
    
    user.password = password;
    await user.save();
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/teachers/:id/send-reset-email
 * @desc    Send password reset email with OTP to teacher
 * @access  Private (superadmin only)
 */
router.post('/:id/send-reset-email', requireRole('superadmin'), async (req, res, next) => {
  try {
    const { NotFoundError } = await import('../middleware/errorHandler.ts');
    const { Teacher } = await import('../models/Teacher.ts');
    const { User } = await import('../models/User.ts');
    const { PasswordReset } = await import('../models/PasswordReset.ts');
    const crypto = await import('crypto');
    const { emailService } = await import('../services/emailService.ts');
    
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) throw new NotFoundError('Teacher', req.params.id);
    
    const user = await User.findById(teacher.userId);
    if (!user) throw new NotFoundError('User account for teacher');
    
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
