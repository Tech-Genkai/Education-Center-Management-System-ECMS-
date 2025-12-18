import express from 'express';
import { requireAuth, requireRole } from '../middleware/session.ts';
import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentMarks,
  getStudentAttendance
} from '../controllers/studentController.ts';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

/**
 * @route   GET /api/students
 * @desc    Get all students with pagination and filtering
 * @access  Private (superadmin, teacher)
 * @query   page, limit, status, class, search
 */
router.get('/', getStudents);

/**
 * @route   GET /api/students/:id
 * @desc    Get a single student by ID
 * @access  Private (superadmin, teacher, student-self)
 */
router.get('/:id', getStudentById);

/**
 * @route   POST /api/students
 * @desc    Create a new student
 * @access  Private (superadmin only)
 */
router.post('/', requireRole('superadmin'), createStudent);

/**
 * @route   PUT /api/students/:id
 * @desc    Update a student
 * @access  Private (superadmin only)
 */
router.put('/:id', requireRole('superadmin'), updateStudent);

/**
 * @route   DELETE /api/students/:id
 * @desc    Delete a student (soft delete by default)
 * @access  Private (superadmin only)
 * @query   hard=true for permanent deletion
 */
router.delete('/:id', requireRole('superadmin'), deleteStudent);

/**
 * @route   GET /api/students/:id/marks
 * @desc    Get student's marks
 * @access  Private (superadmin, teacher, student-self)
 */
router.get('/:id/marks', getStudentMarks);

/**
 * @route   GET /api/students/:id/attendance
 * @desc    Get student's attendance
 * @access  Private (superadmin, teacher, student-self)
 */
router.get('/:id/attendance', getStudentAttendance);

/**
 * @route   POST /api/students/:id/reset-password
 * @desc    Reset student password
 * @access  Private (superadmin only)
 */
router.post('/:id/reset-password', requireRole('superadmin'), async (req, res, next) => {
  try {
    const { NotFoundError, ValidationError } = await import('../middleware/errorHandler.ts');
    const { Student } = await import('../models/Student.ts');
    const { User } = await import('../models/User.ts');
    
    const student = await Student.findById(req.params.id);
    if (!student) throw new NotFoundError('Student', req.params.id);
    
    const { password } = req.body;
    if (!password || password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }
    
    const user = await User.findById(student.userId);
    if (!user) throw new NotFoundError('User account for student');
    
    user.password = password;
    await user.save();
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/students/:id/send-reset-email
 * @desc    Send password reset email with OTP to student
 * @access  Private (superadmin only)
 */
router.post('/:id/send-reset-email', requireRole('superadmin'), async (req, res, next) => {
  try {
    const { NotFoundError } = await import('../middleware/errorHandler.ts');
    const { Student } = await import('../models/Student.ts');
    const { User } = await import('../models/User.ts');
    const { PasswordReset } = await import('../models/PasswordReset.ts');
    const crypto = await import('crypto');
    const { emailService } = await import('../services/emailService.ts');
    
    const student = await Student.findById(req.params.id);
    if (!student) throw new NotFoundError('Student', req.params.id);
    
    const user = await User.findById(student.userId);
    if (!user) throw new NotFoundError('User account for student');
    
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
