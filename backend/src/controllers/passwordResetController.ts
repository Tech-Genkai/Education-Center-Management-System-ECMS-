import type { Request, Response } from 'express';
import crypto from 'crypto';
import { User } from '../models/User.ts';
import { PasswordReset } from '../models/PasswordReset.ts';
import { emailService } from '../services/emailService.ts';

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate secure reset token
function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Initiate password reset - send OTP to user's email
 */
export async function forgotPassword(req: Request, res: Response): Promise<Response> {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ 
      email: email.toLowerCase().trim(), 
      isActive: true 
    });

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      return res.status(200).json({ 
        message: 'If this email exists, an OTP has been sent to it.' 
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate any existing password reset requests for this user
    await PasswordReset.updateMany(
      { userId: user._id, isUsed: false },
      { isUsed: true }
    );

    // Create new password reset record
    await PasswordReset.create({
      userId: user._id,
      email: user.email,
      otp,
      expiresAt,
      isUsed: false,
      attempts: 0
    });

    // Send OTP email
    const emailSent = await emailService.sendOTPEmail(user.email, otp);

    if (!emailSent) {
      console.error('Failed to send OTP email to:', user.email);
      return res.status(500).json({ 
        message: 'Failed to send email. Please try again later or contact support.' 
      });
    }

    return res.status(200).json({ 
      message: 'OTP has been sent to your email address.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ 
      message: 'An error occurred. Please try again later.' 
    });
  }
}

/**
 * Verify OTP and generate reset token
 */
export async function verifyOTP(req: Request, res: Response): Promise<Response> {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find the most recent unused password reset request
    const passwordReset = await PasswordReset.findOne({
      email: email.toLowerCase().trim(),
      otp,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!passwordReset) {
      return res.status(400).json({ 
        message: 'Invalid or expired OTP. Please request a new one.' 
      });
    }

    // Check attempt limit (max 5 attempts)
    if (passwordReset.attempts >= 5) {
      passwordReset.isUsed = true;
      await passwordReset.save();
      return res.status(400).json({ 
        message: 'Too many attempts. Please request a new OTP.' 
      });
    }

    // Increment attempts
    passwordReset.attempts += 1;
    await passwordReset.save();

    // Generate reset token
    const resetToken = generateResetToken();
    passwordReset.resetToken = resetToken;
    await passwordReset.save();

    return res.status(200).json({ 
      message: 'OTP verified successfully',
      resetToken 
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ 
      message: 'An error occurred. Please try again later.' 
    });
  }
}

/**
 * Reset password using reset token
 */
export async function resetPassword(req: Request, res: Response): Promise<Response> {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character' 
      });
    }

    // Find password reset record with the token
    const passwordReset = await PasswordReset.findOne({
      resetToken: token,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!passwordReset) {
      return res.status(400).json({ 
        message: 'Invalid or expired reset token' 
      });
    }

    // Find user
    const user = await User.findById(passwordReset.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    // Mark password reset as used
    passwordReset.isUsed = true;
    await passwordReset.save();

    // Send confirmation email
    await emailService.sendPasswordResetSuccessEmail(user.email);

    return res.status(200).json({ 
      message: 'Password reset successful. You can now login with your new password.' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ 
      message: 'An error occurred. Please try again later.' 
    });
  }
}
