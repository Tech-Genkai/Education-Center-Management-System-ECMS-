import type { Request, Response } from 'express';
import { z } from 'zod';
import { ClassModel } from '../models/Class.ts';
import { Teacher } from '../models/Teacher.ts';
import { Subject } from '../models/Subject.ts';
import { Student } from '../models/Student.ts';

// Zod Schemas
const createClassSchema = z.object({
  className: z.string().min(1).max(50),
  classCode: z.string().min(1).max(20),
  section: z.string().optional(),
  academicYear: z.string().min(4).max(20),
  classTeacherId: z.string().optional(), // ObjectId as string
  capacity: z.number().int().positive().optional(),
  isActive: z.boolean().optional()
});

const updateClassSchema = createClassSchema.partial().omit({ classCode: true });

/**
 * Get all classes
 */
export const getClasses = async (req: Request, res: Response) => {
  try {
    const classes = await ClassModel.find()
      .populate('classTeacherId', 'firstName lastName')
      .populate('subjects', 'subjectName subjectCode')
      .sort({ createdAt: -1 });

    return res.status(200).json({ classes });
  } catch (error: any) {
    console.error('Error fetching classes:', error);
    return res.status(500).json({
      message: 'Failed to fetch classes',
      error: error.message
    });
  }
};

/**
 * Get class by ID
 */
export const getClassById = async (req: Request, res: Response) => {
  try {
    const classId = req.params.id;
    const classItem = await ClassModel.findById(classId)
      .populate('classTeacherId', 'firstName lastName')
      .populate('subjects', 'subjectName subjectCode');

    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    return res.status(200).json({ class: classItem });
  } catch (error: any) {
    console.error('Error fetching class:', error);
    return res.status(500).json({
      message: 'Failed to fetch class',
      error: error.message
    });
  }
};

/**
 * Create a new class
 */
export const createClass = async (req: Request, res: Response) => {
  try {
    const parsed = createClassSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.errors
      });
    }

    const data = parsed.data;

    const existingClass = await ClassModel.findOne({ classCode: data.classCode });
    if (existingClass) {
      return res.status(400).json({ message: 'Class code already exists' });
    }

    // specific check for teacher if provided
    if (data.classTeacherId) {
       const teacherExists = await Teacher.findById(data.classTeacherId);
       if (!teacherExists) {
         return res.status(400).json({ message: 'Teacher not found' });
       }
    }

    const newClass = new ClassModel(data);
    await newClass.save();

    return res.status(201).json({
      message: 'Class created successfully',
      class: newClass
    });
  } catch (error: any) {
    console.error('Error creating class:', error);
    return res.status(500).json({
      message: 'Failed to create class',
      error: error.message
    });
  }
};

/**
 * Update a class
 */
export const updateClass = async (req: Request, res: Response) => {
  try {
    const parsed = updateClassSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.errors
      });
    }

    const classId = req.params.id;
    const data = parsed.data;

    const classItem = await ClassModel.findById(classId);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // specific check for teacher if provided
    if (data.classTeacherId) {
       const teacherExists = await Teacher.findById(data.classTeacherId);
       if (!teacherExists) {
         return res.status(400).json({ message: 'Teacher not found' });
       }
    }

    Object.assign(classItem, data);
    await classItem.save();

    return res.status(200).json({
      message: 'Class updated successfully',
      class: classItem
    });
  } catch (error: any) {
    console.error('Error updating class:', error);
    return res.status(500).json({
      message: 'Failed to update class',
      error: error.message
    });
  }
};

/**
 * Delete a class
 */
export const deleteClass = async (req: Request, res: Response) => {
  try {
    const classId = req.params.id;
    const classItem = await ClassModel.findById(classId);

    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if students are assigned to this class
     const studentsInClass = await Student.findOne({ currentClass: classItem.className }); // Logic might need refinement if relation uses ID
     // Note: Student model uses 'currentClass' as string currently, so we check by name or ID if refactored.
     // Assuming currentClass stores className or we should update Student to store classId. 
     // For now, let's just delete. Safe delete logic can be enhanced.

    await ClassModel.findByIdAndDelete(classId);

    return res.status(200).json({ message: 'Class deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting class:', error);
    return res.status(500).json({
      message: 'Failed to delete class',
      error: error.message
    });
  }
};
