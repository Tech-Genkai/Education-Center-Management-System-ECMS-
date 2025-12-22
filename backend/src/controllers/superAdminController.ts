import type { Request, Response } from 'express';
import { z } from 'zod';
import { SuperAdmin } from '../models/SuperAdmin.ts';
import { User } from '../models/User.ts';
import { Types } from 'mongoose';
import bcrypt from 'bcrypt';
import { io } from '../server.ts';
import { emailService } from '../services/emailService.ts';

// Validation schemas
// Validation schemas
const createSuperAdminSchema = z.object({
  // User fields
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(10).optional(),
  password: z.string().min(8).optional(),
  instituteEmail: z.string().email().optional(),
  
  // SuperAdmin Profile fields
  adminId: z.string().min(1).max(50),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  addressId: z.string().optional().refine((val) => !val || Types.ObjectId.isValid(val), {
    message: 'Invalid addressId format'
  }),
  designation: z.string().min(1).max(200),
  department: z.string().min(1).max(200),
  permissions: z.array(z.string()).optional(),
  accessLevel: z.enum(['full', 'restricted', 'view-only']).optional(),
  mfaEnabled: z.boolean().optional(),
  sessionTimeout: z.number().min(300).max(86400).optional()
});

const updateSuperAdminSchema = createSuperAdminSchema.partial().omit({ adminId: true, password: true }).extend({
  profilePicture: z.string().url().optional()
});

const updatePermissionsSchema = z.object({
  permissions: z.array(z.string()).min(1)
});

const updateAccessLevelSchema = z.object({
  accessLevel: z.enum(['full', 'restricted', 'view-only'])
});

const toggleMFASchema = z.object({
  mfaEnabled: z.boolean(),
  mfaSecret: z.string().optional()
});

/**
 * Create a new SuperAdmin profile and User account
 */
export const createSuperAdmin = async (req: Request, res: Response) => {
  console.log('DEBUG: createSuperAdmin called with body:', req.body);
  try {
    const parsed = createSuperAdminSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error('DEBUG: Validation failed:', parsed.error.errors);
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.errors
      });
    }

    const data = parsed.data;

    // Check if user with email exists
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email already exists' 
      });
    }

    // Check if adminId is unique
    const existingAdminId = await SuperAdmin.findOne({ adminId: data.adminId });
    if (existingAdminId) {
      return res.status(400).json({ message: 'AdminId already exists' });
    }

    // Create user account
    const password = data.password || `Admin@${Math.random().toString(36).slice(-8)}`;
    const user = new User({
      email: data.email.toLowerCase(),
      instituteEmail: data.instituteEmail?.toLowerCase() || data.email.toLowerCase(), // Fallback to email if not provided
      phone: data.phone,
      password: password,
      role: 'superadmin',
      isActive: true
    });
    await user.save();

    // Create SuperAdmin profile
    const superAdmin = new SuperAdmin({
      userId: user._id,
      adminId: data.adminId,
      email: data.email.toLowerCase(),
      instituteEmail: data.instituteEmail?.toLowerCase() || data.email.toLowerCase(),
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      designation: data.designation,
      department: data.department,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      permissions: data.permissions || [],
      accessLevel: data.accessLevel || 'full',
      status: 'active'
    });
    await superAdmin.save();

    // Emit Socket.IO event for real-time updates (optional)
    try {
      io?.emit('admin:created', { admin: superAdmin });
    } catch (err) {
      console.log('Socket.IO not available for real-time updates');
    }

    // Send welcome email with credentials (non-blocking)
    emailService.sendWelcomeCredentials(data.email, password, 'admin', `${data.firstName} ${data.lastName}`.trim()).catch(() => undefined);

    return res.status(201).json({
      message: 'SuperAdmin created successfully',
      superAdmin,
      credentials: {
        email: data.email,
        password: password
      }
    });
  } catch (error: any) {
    console.error('Error creating SuperAdmin:', error);
    return res.status(500).json({
      message: 'Failed to create SuperAdmin profile',
      error: error.message
    });
  }
};

/**
 * Get all SuperAdmin profiles with optional filtering and pagination
 */
export const getSuperAdmins = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, accessLevel, search } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter: any = {};
    if (status) filter.status = status;
    if (accessLevel) filter.accessLevel = accessLevel;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { adminId: { $regex: search, $options: 'i' } }
      ];
    }

    const [superAdmins, total] = await Promise.all([
      SuperAdmin.find(filter)
        .populate('userId', 'email role isActive lastLogin')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      SuperAdmin.countDocuments(filter)
    ]);

    return res.status(200).json({
      superAdmins,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching SuperAdmins:', error);
    return res.status(500).json({
      message: 'Failed to fetch SuperAdmin profiles',
      error: error.message
    });
  }
};

/**
 * Get a single SuperAdmin profile by ID
 */
export const getSuperAdminById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const superAdmin = await SuperAdmin.findById(id)
      .populate('userId', 'email role isActive lastLogin')
      .populate('addressId')
      .lean();

    if (!superAdmin) {
      return res.status(404).json({ message: 'SuperAdmin not found' });
    }

    return res.status(200).json({ superAdmin });
  } catch (error: any) {
    console.error('Error fetching SuperAdmin:', error);
    return res.status(500).json({
      message: 'Failed to fetch SuperAdmin profile',
      error: error.message
    });
  }
};

/**
 * Update a SuperAdmin profile
 */
export const updateSuperAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const parsed = updateSuperAdminSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.errors
      });
    }

    const data = parsed.data;
    const superAdmin = await SuperAdmin.findById(id);

    if (!superAdmin) {
      return res.status(404).json({ message: 'SuperAdmin not found' });
    }

    Object.assign(superAdmin, data);
    if (data.email) superAdmin.email = data.email.toLowerCase();
    if (data.instituteEmail) superAdmin.instituteEmail = data.instituteEmail.toLowerCase();
    await superAdmin.save();

    // Update user if email or phone changed
    const user = await User.findById(superAdmin.userId);
    if (user) {
      let userUpdated = false;
      
      // Only update email if it's different
      if (data.email && user.email !== data.email.toLowerCase()) {
        user.email = data.email.toLowerCase();
        userUpdated = true;
      }
      
      // Only update instituteEmail if it's different
      if (data.instituteEmail && user.instituteEmail !== data.instituteEmail.toLowerCase()) {
        user.instituteEmail = data.instituteEmail.toLowerCase();
        userUpdated = true;
      }
      
      // Only update phone if it's different
      if (data.phone && user.phone !== data.phone) {
        user.phone = data.phone;
        userUpdated = true;
      }
      
      // Only save if something changed
      if (userUpdated) {
        await user.save();
      }
    }

    return res.status(200).json({
      message: 'SuperAdmin profile updated successfully',
      superAdmin
    });
  } catch (error: any) {
    console.error('Error updating SuperAdmin:', error);
    return res.status(500).json({
      message: 'Failed to update SuperAdmin profile',
      error: error.message
    });
  }
};

/**
 * Delete a SuperAdmin profile (soft delete by setting status to inactive)
 */
export const deleteSuperAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { hard } = req.query;
    const { password } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // Verify password for hard delete
    if (hard === 'true' && password) {
      const adminUser = await User.findById(req.session.userId);
      if (!adminUser) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const isPasswordValid = await bcrypt.compare(password, adminUser.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid password' });
      }
    } else if (hard === 'true' && !password) {
      return res.status(400).json({ message: 'Password is required for permanent deletion' });
    }

    if (hard === 'true') {
      // Hard delete - permanently remove from database
      const superAdmin = await SuperAdmin.findByIdAndDelete(id);
      if (!superAdmin) {
        return res.status(404).json({ message: 'SuperAdmin not found' });
      }
      
<<<<<<< HEAD
      // Also delete the associated User account
      if (superAdmin.userId) {
        await User.findByIdAndDelete(superAdmin.userId);
      }
=======
      // Emit Socket.IO event for real-time updates
      io.emit('admin:deleted', { adminId: id, hard: true });
>>>>>>> 149c5931210241bed4a4a1a881d32aea3cd7f76a
      
      return res.status(200).json({ message: 'SuperAdmin permanently deleted' });
    } else {
      // Soft delete - set status to inactive
      const superAdmin = await SuperAdmin.findByIdAndUpdate(
        id,
        { $set: { status: 'inactive' } },
        { new: true }
      );

      if (!superAdmin) {
        return res.status(404).json({ message: 'SuperAdmin not found' });
      }

      // Emit Socket.IO event for real-time updates
      io.emit('admin:deleted', { adminId: id, admin: superAdmin });

      return res.status(200).json({
        message: 'SuperAdmin deactivated successfully',
        superAdmin
      });
    }
  } catch (error: any) {
    console.error('Error deleting SuperAdmin:', error);
    return res.status(500).json({
      message: 'Failed to delete SuperAdmin profile',
      error: error.message
    });
  }
};

/**
 * Update SuperAdmin permissions
 */
export const updatePermissions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const parsed = updatePermissionsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.errors
      });
    }

    const superAdmin = await SuperAdmin.findByIdAndUpdate(
      id,
      { $set: { permissions: parsed.data.permissions } },
      { new: true }
    );

    if (!superAdmin) {
      return res.status(404).json({ message: 'SuperAdmin not found' });
    }

    return res.status(200).json({
      message: 'Permissions updated successfully',
      superAdmin
    });
  } catch (error: any) {
    console.error('Error updating permissions:', error);
    return res.status(500).json({
      message: 'Failed to update permissions',
      error: error.message
    });
  }
};

/**
 * Update SuperAdmin access level
 */
export const updateAccessLevel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const parsed = updateAccessLevelSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.errors
      });
    }

    const superAdmin = await SuperAdmin.findByIdAndUpdate(
      id,
      { $set: { accessLevel: parsed.data.accessLevel } },
      { new: true }
    );

    if (!superAdmin) {
      return res.status(404).json({ message: 'SuperAdmin not found' });
    }

    return res.status(200).json({
      message: 'Access level updated successfully',
      superAdmin
    });
  } catch (error: any) {
    console.error('Error updating access level:', error);
    return res.status(500).json({
      message: 'Failed to update access level',
      error: error.message
    });
  }
};

/**
 * Toggle MFA for a SuperAdmin
 */
export const toggleMFA = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const parsed = toggleMFASchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.errors
      });
    }

    const updateData: any = { mfaEnabled: parsed.data.mfaEnabled };
    if (parsed.data.mfaSecret !== undefined) {
      updateData.mfaSecret = parsed.data.mfaSecret;
    }

    const superAdmin = await SuperAdmin.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!superAdmin) {
      return res.status(404).json({ message: 'SuperAdmin not found' });
    }

    return res.status(200).json({
      message: `MFA ${parsed.data.mfaEnabled ? 'enabled' : 'disabled'} successfully`,
      superAdmin
    });
  } catch (error: any) {
    console.error('Error toggling MFA:', error);
    return res.status(500).json({
      message: 'Failed to toggle MFA',
      error: error.message
    });
  }
};

/**
 * Update last login timestamp
 */
export const updateLastLogin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const superAdmin = await SuperAdmin.findByIdAndUpdate(
      id,
      { $set: { lastLoginAt: new Date() } },
      { new: true }
    );

    if (!superAdmin) {
      return res.status(404).json({ message: 'SuperAdmin not found' });
    }

    return res.status(200).json({
      message: 'Last login updated successfully',
      superAdmin
    });
  } catch (error: any) {
    console.error('Error updating last login:', error);
    return res.status(500).json({
      message: 'Failed to update last login',
      error: error.message
    });
  }
};
