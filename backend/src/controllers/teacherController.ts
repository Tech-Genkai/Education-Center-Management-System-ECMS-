import type { Request, Response } from 'express';
import { z } from 'zod';
import { Teacher } from '../models/Teacher.ts';
import { User } from '../models/User.ts';
import { Types } from 'mongoose';
import bcrypt from 'bcrypt';
import { io } from '../server.ts';
import { emailService } from '../services/emailService.ts';

const SALT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 12;

// Validation schemas
const createTeacherSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  instituteEmail: z.string().email().optional(),
  phone: z.string().min(10),
  teacherId: z.string().min(1).max(50),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'unspecified']).optional(),
  department: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  joiningDate: z.string().optional(),
  experience: z.number().optional(),
  salary: z.number().optional(),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),
  password: z.string().min(8).optional()
});

const updateTeacherSchema = createTeacherSchema.partial().omit({ teacherId: true });

/**
 * Get all teachers with optional filtering and pagination
 */
export const getTeachers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const status = req.query.status as string;
    const search = req.query.search as string;
    const department = req.query.department as string;

    // Build query
    const query: any = {};
    if (status) query.status = status;
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { teacherId: { $regex: search, $options: 'i' } }
      ];
      // Search by email is not available directly on Teacher model
    }

    const teachers = await Teacher.find(query)
      .populate('userId', 'email phone instituteEmail')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Teacher.countDocuments(query);

    return res.status(200).json({
      teachers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching teachers:', error);
    return res.status(500).json({
      message: 'Failed to fetch teachers',
      error: error.message
    });
  }
};

/**
 * Get a single teacher by ID
 */
export const getTeacherById = async (req: Request, res: Response) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate('userId', '-password');
    
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    return res.status(200).json({ teacher });
  } catch (error: any) {
    console.error('Error fetching teacher:', error);
    return res.status(500).json({
      message: 'Failed to fetch teacher',
      error: error.message
    });
  }
};

/**
 * Create a new teacher
 */
export const createTeacher = async (req: Request, res: Response) => {
  try {
    const parsed = createTeacherSchema.safeParse(req.body);
    if (!parsed.success) {
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

    // Check if teacher ID already exists
    const existingTeacherId = await Teacher.findOne({ teacherId: data.teacherId });
    if (existingTeacherId) {
      return res.status(400).json({ 
        message: 'Teacher ID already exists' 
      });
    }

    // Create user account
    const password = data.password || `Teacher@${Math.random().toString(36).slice(-8)}`;
    const user = new User({
      email: data.email.toLowerCase(),
      instituteEmail: data.instituteEmail ? data.instituteEmail.toLowerCase() : undefined,
      phone: data.phone,
      password: password,
      role: 'teacher',
      isActive: true
    });
    await user.save();

    // Create teacher profile
    const teacher = new Teacher({
      userId: user._id,
      teacherId: data.teacherId,
      email: data.email.toLowerCase(),
      instituteEmail: data.instituteEmail ? data.instituteEmail.toLowerCase() : undefined,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender || 'unspecified',
      department: data.department,
      qualification: data.qualification,
      specialization: data.specialization,
      joiningDate: data.joiningDate || new Date(),
      experience: data.experience,
      salary: data.salary,
      address: data.address,
      bloodGroup: data.bloodGroup,
      emergencyContact: data.emergencyContact,
      status: 'active'
    });
    await teacher.save();

    // Emit Socket.IO event for real-time updates (optional)
    try {
      io?.emit('teacher:created', { teacher });
    } catch (err) {
      console.log('Socket.IO not available for real-time updates');
    }

    // Send welcome email with credentials (non-blocking)
    emailService.sendWelcomeCredentials(data.email, password, 'teacher', `${data.firstName} ${data.lastName}`.trim()).catch(() => undefined);

    return res.status(201).json({
      message: 'Teacher created successfully',
      teacher,
      credentials: {
        email: data.email,
        password: password
      }
    });
  } catch (error: any) {
    console.error('Error creating teacher:', error);
    return res.status(500).json({
      message: 'Failed to create teacher',
      error: error.message
    });
  }
};

/**
 * Update a teacher
 */
export const updateTeacher = async (req: Request, res: Response) => {
  try {
    const parsed = updateTeacherSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.errors
      });
    }

    const data = parsed.data;
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Update teacher
    Object.assign(teacher, data);
    if (data.email) teacher.email = data.email.toLowerCase();
    if (data.instituteEmail) teacher.instituteEmail = data.instituteEmail.toLowerCase();
    await teacher.save();

    // Update user if email or phone changed
    const user = await User.findById(teacher.userId);
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

    // Emit Socket.IO event for real-time updates (optional)
    try {
      io?.emit('teacher:updated', { teacher });
    } catch (err) {
      console.log('Socket.IO not available for real-time updates');
    }

    return res.status(200).json({
      message: 'Teacher updated successfully',
      teacher
    });
  } catch (error: any) {
    console.error('Error updating teacher:', error);
    return res.status(500).json({
      message: 'Failed to update teacher',
      error: error.message
    });
  }
};

/**
 * Delete a teacher (soft delete by default)
 */
export const deleteTeacher = async (req: Request, res: Response) => {
  try {
    const hardDelete = req.query.hard === 'true';
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    if (hardDelete) {
      // Permanent deletion
      await User.findByIdAndDelete(teacher.userId);
      await Teacher.findByIdAndDelete(req.params.id);
      
      // Emit Socket.IO event (optional)
      try {
        io?.emit('teacher:deleted', { id: req.params.id, hard: true });
      } catch (err) {
        console.log('Socket.IO not available for real-time updates');
      }
      
      return res.status(200).json({ message: 'Teacher permanently deleted' });
    } else {
      // Soft delete - mark as inactive
      teacher.status = 'inactive';
      await teacher.save();

      const user = await User.findById(teacher.userId);
      if (user) {
        user.isActive = false;
        await user.save();
      }

      // Emit Socket.IO event (optional)
      try {
        io?.emit('teacher:deleted', { id: req.params.id, teacher, hard: false });
      } catch (err) {
        console.log('Socket.IO not available for real-time updates');
      }

      return res.status(200).json({ message: 'Teacher deactivated successfully' });
    }
  } catch (error: any) {
    console.error('Error deleting teacher:', error);
    return res.status(500).json({
      message: 'Failed to delete teacher',
      error: error.message
    });
  }
};

/**
 * Get teacher's assigned classes
 */
export const getTeacherClasses = async (req: Request, res: Response) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // TODO: Implement classes fetching when Class model routes are ready
    return res.status(200).json({
      message: 'Classes endpoint - coming soon',
      classes: []
    });
  } catch (error: any) {
    console.error('Error fetching classes:', error);
    return res.status(500).json({
      message: 'Failed to fetch classes',
      error: error.message
    });
  }
};

/**
 * Get teacher's assigned subjects
 */
export const getTeacherSubjects = async (req: Request, res: Response) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // TODO: Implement subjects fetching when Subject model routes are ready
    return res.status(200).json({
      message: 'Subjects endpoint - coming soon',
      subjects: []
    });
  } catch (error: any) {
    console.error('Error fetching subjects:', error);
    return res.status(500).json({
      message: 'Failed to fetch subjects',
      error: error.message
    });
  }
};
