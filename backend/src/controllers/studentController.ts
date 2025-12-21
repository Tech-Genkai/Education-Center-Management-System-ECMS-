import type { Request, Response } from 'express';
import { z } from 'zod';
import { Student } from '../models/Student.ts';
import { User } from '../models/User.ts';
import { Types } from 'mongoose';
import bcrypt from 'bcrypt';
import { io } from '../server.ts';
import { emailService } from '../services/emailService.ts';

const SALT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 12;

// Validation schemas
const createStudentSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  instituteEmail: z.string().email().optional(),
  phone: z.string().min(10),
  studentId: z.string().min(1).max(50),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'unspecified']).optional(),
  currentClass: z.string().optional(),
  section: z.string().optional(),
  rollNumber: z.string().min(1),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianEmail: z.string().email().optional(),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  password: z.string().min(8).optional()
});

const updateStudentSchema = createStudentSchema.partial().omit({ studentId: true });

/**
 * Get all students with optional filtering and pagination
 */
export const getStudents = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const status = req.query.status as string;
    const search = req.query.search as string;
    const currentClass = req.query.class as string;

    // Build query
    const query: any = {};
    if (status) query.status = status;
    if (currentClass) query.currentClass = currentClass;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
      // Note: Searching by email is temporarily disabled in this view or requires aggregation lookup
      // Future TODO: Aggregation pipeline to search users by email and filter students
    }

    const students = await Student.find(query)
      .populate('userId', 'email phone instituteEmail')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Student.countDocuments(query);

    return res.status(200).json({
      students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching students:', error);
    return res.status(500).json({
      message: 'Failed to fetch students',
      error: error.message
    });
  }
};

/**
 * Get a single student by ID
 */
export const getStudentById = async (req: Request, res: Response) => {
  try {
    const student = await Student.findById(req.params.id).populate('userId', '-password');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    return res.status(200).json({ student });
  } catch (error: any) {
    console.error('Error fetching student:', error);
    return res.status(500).json({
      message: 'Failed to fetch student',
      error: error.message
    });
  }
};

/**
 * Create a new student
 */
export const createStudent = async (req: Request, res: Response) => {
  try {
    const parsed = createStudentSchema.safeParse(req.body);
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

    // Check if student ID already exists
    const existingStudentId = await Student.findOne({ studentId: data.studentId });
    if (existingStudentId) {
      return res.status(400).json({ 
        message: 'Student ID already exists' 
      });
    }

    // Create user account
    const password = data.password || `Student@${Math.random().toString(36).slice(-8)}`;
    const user = new User({
      email: data.email.toLowerCase(),
      instituteEmail: data.instituteEmail ? data.instituteEmail.toLowerCase() : undefined,
      phone: data.phone,
      password: password,
      role: 'student',
      isActive: true
    });
    await user.save();

    // Create student profile
    const student = new Student({
      userId: user._id,
      studentId: data.studentId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      instituteEmail: data.instituteEmail ? data.instituteEmail.toLowerCase() : undefined,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender || 'unspecified',
      currentClass: data.currentClass,
      section: data.section,
      rollNumber: data.rollNumber,
      guardianName: data.guardianName,
      guardianPhone: data.guardianPhone,
      guardianEmail: data.guardianEmail,
      address: data.address,
      bloodGroup: data.bloodGroup,
      status: 'active'
    });
    await student.save();

    // Emit Socket.IO event for real-time updates
    io.emit('student:created', { student });

    // Send welcome email with credentials (non-blocking)
    emailService.sendWelcomeCredentials(data.email, password, 'student', `${data.firstName} ${data.lastName}`.trim()).catch(() => undefined);

    return res.status(201).json({
      message: 'Student created successfully',
      student,
      credentials: {
        email: data.email,
        password: password
      }
    });
  } catch (error: any) {
    console.error('Error creating student:', error);
    return res.status(500).json({
      message: 'Failed to create student',
      error: error.message
    });
  }
};

/**
 * Update a student
 */
export const updateStudent = async (req: Request, res: Response) => {
  try {
    const parsed = updateStudentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.errors
      });
    }

    const data = parsed.data;
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Update student
    Object.assign(student, data);
    if (data.email) student.email = data.email.toLowerCase();
    if (data.instituteEmail) student.instituteEmail = data.instituteEmail.toLowerCase();
    await student.save();

    // Update user if email or phone changed
    if (data.email || data.phone || data.instituteEmail) {
      const user = await User.findById(student.userId);
      if (user) {
        if (data.email) user.email = data.email.toLowerCase();
        if (data.instituteEmail) user.instituteEmail = data.instituteEmail.toLowerCase();
        if (data.phone) user.phone = data.phone;
        await user.save();
      }
    }

    // Emit Socket.IO event for real-time updates
    io.emit('student:updated', { student });

    return res.status(200).json({
      message: 'Student updated successfully',
      student
    });
  } catch (error: any) {
    console.error('Error updating student:', error);
    return res.status(500).json({
      message: 'Failed to update student',
      error: error.message
    });
  }
};

/**
 * Delete a student (soft delete by default)
 */
export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const hardDelete = req.query.hard === 'true';
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (hardDelete) {
      // Permanent deletion
      await User.findByIdAndDelete(student.userId);
      await Student.findByIdAndDelete(req.params.id);
      
      // Emit Socket.IO event
      io.emit('student:deleted', { id: req.params.id, hard: true });
      
      return res.status(200).json({ message: 'Student permanently deleted' });
    } else {
      // Soft delete - mark as inactive
      student.status = 'inactive';
      await student.save();

      const user = await User.findById(student.userId);
      if (user) {
        user.isActive = false;
        await user.save();
      }

      // Emit Socket.IO event
      io.emit('student:deleted', { id: req.params.id, student, hard: false });

      return res.status(200).json({ message: 'Student deactivated successfully' });
    }
  } catch (error: any) {
    console.error('Error deleting student:', error);
    return res.status(500).json({
      message: 'Failed to delete student',
      error: error.message
    });
  }
};

/**
 * Get student's marks
 */
export const getStudentMarks = async (req: Request, res: Response) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // TODO: Implement marks fetching when Mark model routes are ready
    return res.status(200).json({
      message: 'Marks endpoint - coming soon',
      marks: []
    });
  } catch (error: any) {
    console.error('Error fetching marks:', error);
    return res.status(500).json({
      message: 'Failed to fetch marks',
      error: error.message
    });
  }
};

/**
 * Get student's attendance
 */
export const getStudentAttendance = async (req: Request, res: Response) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // TODO: Implement attendance fetching when Attendance model routes are ready
    return res.status(200).json({
      message: 'Attendance endpoint - coming soon',
      attendance: []
    });
  } catch (error: any) {
    console.error('Error fetching attendance:', error);
    return res.status(500).json({
      message: 'Failed to fetch attendance',
      error: error.message
    });
  }
};
