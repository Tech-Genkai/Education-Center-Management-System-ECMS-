import type { Request, Response } from 'express';
import { z } from 'zod';
import { Subject } from '../models/Subject.ts';
import { Teacher } from '../models/Teacher.ts';
import { ClassModel } from '../models/Class.ts';

// Zod Schemas
const createSubjectSchema = z.object({
  subjectCode: z.string().min(1).max(20),
  subjectName: z.string().min(1).max(100),
  description: z.string().optional(),
  credits: z.number().int().positive().optional(),
  teacherId: z.string().optional(), // ObjectId as string
  classId: z.string().optional(),
  isActive: z.boolean().optional()
});

const updateSubjectSchema = createSubjectSchema.partial().omit({ subjectCode: true });

/**
 * Get all subjects
 */
export const getSubjects = async (req: Request, res: Response) => {
  try {
    const subjects = await Subject.find()
      .populate('teacherId', 'firstName lastName')
      .populate('classId', 'className classCode')
      .sort({ createdAt: -1 });

    return res.status(200).json({ subjects });
  } catch (error: any) {
    console.error('Error fetching subjects:', error);
    return res.status(500).json({
      message: 'Failed to fetch subjects',
      error: error.message
    });
  }
};

/**
 * Get subject by ID
 */
export const getSubjectById = async (req: Request, res: Response) => {
  try {
    const subjectId = req.params.id;
    const subject = await Subject.findById(subjectId)
      .populate('teacherId', 'firstName lastName')
      .populate('classId', 'className classCode');

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    return res.status(200).json({ subject });
  } catch (error: any) {
    console.error('Error fetching subject:', error);
    return res.status(500).json({
      message: 'Failed to fetch subject',
      error: error.message
    });
  }
};

/**
 * Create a new subject
 */
export const createSubject = async (req: Request, res: Response) => {
  try {
    const parsed = createSubjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.errors
      });
    }

    const data = parsed.data;

    const existingSubject = await Subject.findOne({ subjectCode: data.subjectCode });
    if (existingSubject) {
      return res.status(400).json({ message: 'Subject code already exists' });
    }

    if (data.teacherId) {
      const teacherExists = await Teacher.findById(data.teacherId);
      if (!teacherExists) {
        return res.status(400).json({ message: 'Teacher not found' });
      }
    }

    if (data.classId) {
      const classExists = await ClassModel.findById(data.classId);
      if (!classExists) {
        return res.status(400).json({ message: 'Class not found' });
      }
    }

    const newSubject = new Subject(data);
    await newSubject.save();

    // If assigned to a class, update class's subjects array
    if (data.classId) {
       await ClassModel.findByIdAndUpdate(data.classId, {
         $addToSet: { subjects: newSubject._id }
       });
    }

    return res.status(201).json({
      message: 'Subject created successfully',
      subject: newSubject
    });
  } catch (error: any) {
    console.error('Error creating subject:', error);
    return res.status(500).json({
      message: 'Failed to create subject',
      error: error.message
    });
  }
};

/**
 * Update a subject
 */
export const updateSubject = async (req: Request, res: Response) => {
  try {
    const parsed = updateSubjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.errors
      });
    }

    const subjectId = req.params.id;
    const data = parsed.data;

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Handle class change logic if needed (remove from old class, add to new)
    if (data.classId && data.classId !== subject.classId?.toString()) {
       if (subject.classId) {
         await ClassModel.findByIdAndUpdate(subject.classId, {
           $pull: { subjects: subject._id }
         });
       }
       await ClassModel.findByIdAndUpdate(data.classId, {
         $addToSet: { subjects: subject._id }
       });
    }

    Object.assign(subject, data);
    await subject.save();

    return res.status(200).json({
      message: 'Subject updated successfully',
      subject
    });
  } catch (error: any) {
    console.error('Error updating subject:', error);
    return res.status(500).json({
      message: 'Failed to update subject',
      error: error.message
    });
  }
};

/**
 * Delete a subject
 */
export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const subjectId = req.params.id;
    const subject = await Subject.findById(subjectId);

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Remove reference from Class
    if (subject.classId) {
      await ClassModel.findByIdAndUpdate(subject.classId, {
        $pull: { subjects: subject._id }
      });
    }

    await Subject.findByIdAndDelete(subjectId);

    return res.status(200).json({ message: 'Subject deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting subject:', error);
    return res.status(500).json({
      message: 'Failed to delete subject',
      error: error.message
    });
  }
};
