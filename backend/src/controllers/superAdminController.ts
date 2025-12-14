import type { Request, Response } from 'express';
import { z } from 'zod';
import { SuperAdmin } from '../models/SuperAdmin.ts';
import { User } from '../models/User.ts';
import { Types } from 'mongoose';

// Validation schemas
const createSuperAdminSchema = z.object({
  userId: z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: 'Invalid userId format'
  }),
  adminId: z.string().min(1).max(50),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  email: z.string().email(),
  instituteEmail: z.string().email().optional(),
  phone: z.string().optional(),
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

const updateSuperAdminSchema = createSuperAdminSchema.partial().omit({ userId: true, adminId: true });

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
 * Create a new SuperAdmin profile
 */
export const createSuperAdmin = async (req: Request, res: Response) => {
  try {
    const parsed = createSuperAdminSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.errors
      });
    }

    const data = parsed.data;

    // Check if user exists and has superadmin role
    const user = await User.findById(data.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role !== 'superadmin') {
      return res.status(400).json({ message: 'User must have superadmin role' });
    }

    // Check if SuperAdmin profile already exists for this user
    const existingAdmin = await SuperAdmin.findOne({ userId: data.userId });
    if (existingAdmin) {
      return res.status(400).json({ message: 'SuperAdmin profile already exists for this user' });
    }

    // Check if adminId is unique
    const existingAdminId = await SuperAdmin.findOne({ adminId: data.adminId });
    if (existingAdminId) {
      return res.status(400).json({ message: 'AdminId already exists' });
    }

    const superAdmin = new SuperAdmin(data);
    await superAdmin.save();

    return res.status(201).json({
      message: 'SuperAdmin profile created successfully',
      superAdmin
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
        { email: { $regex: search, $options: 'i' } },
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

    const superAdmin = await SuperAdmin.findByIdAndUpdate(
      id,
      { $set: parsed.data },
      { new: true, runValidators: true }
    );

    if (!superAdmin) {
      return res.status(404).json({ message: 'SuperAdmin not found' });
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

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    if (hard === 'true') {
      // Hard delete - permanently remove from database
      const superAdmin = await SuperAdmin.findByIdAndDelete(id);
      if (!superAdmin) {
        return res.status(404).json({ message: 'SuperAdmin not found' });
      }
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
