import type { Request, Response } from 'express';
import { z } from 'zod';
import { AcademicYear } from '../models/AcademicYear.ts';

// Zod Schemas
const createAcademicYearSchema = z.object({
  year: z.string().min(1).max(20).trim(),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  isCurrent: z.boolean().optional()
});

const updateAcademicYearSchema = createAcademicYearSchema.partial();

/**
 * Get all academic years
 */
export const getAcademicYears = async (req: Request, res: Response) => {
  try {
    const academicYears = await AcademicYear.find()
      .sort({ year: -1 });

    return res.status(200).json({ academicYears });
  } catch (error: any) {
    console.error('Error fetching academic years:', error);
    return res.status(500).json({
      message: 'Failed to fetch academic years',
      error: error.message
    });
  }
};

/**
 * Get current academic year
 */
export const getCurrentAcademicYear = async (req: Request, res: Response) => {
  try {
    const currentYear = await AcademicYear.findOne({ isCurrent: true });

    if (!currentYear) {
      return res.status(404).json({ message: 'No current academic year set' });
    }

    return res.status(200).json({ academicYear: currentYear });
  } catch (error: any) {
    console.error('Error fetching current academic year:', error);
    return res.status(500).json({
      message: 'Failed to fetch current academic year',
      error: error.message
    });
  }
};

/**
 * Get academic year by ID
 */
export const getAcademicYearById = async (req: Request, res: Response) => {
  try {
    const yearId = req.params.id;
    const academicYear = await AcademicYear.findById(yearId);

    if (!academicYear) {
      return res.status(404).json({ message: 'Academic year not found' });
    }

    return res.status(200).json({ academicYear });
  } catch (error: any) {
    console.error('Error fetching academic year:', error);
    return res.status(500).json({
      message: 'Failed to fetch academic year',
      error: error.message
    });
  }
};

/**
 * Create a new academic year
 */
export const createAcademicYear = async (req: Request, res: Response) => {
  try {
    const parsed = createAcademicYearSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.errors
      });
    }

    const data = parsed.data;

    // Check if year already exists
    const existingYear = await AcademicYear.findOne({ year: data.year });
    if (existingYear) {
      return res.status(400).json({ message: 'Academic year already exists' });
    }

    // Validate dates
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end <= start) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const newYear = new AcademicYear({
      ...data,
      startDate: start,
      endDate: end
    });
    await newYear.save();

    return res.status(201).json({
      message: 'Academic year created successfully',
      academicYear: newYear
    });
  } catch (error: any) {
    console.error('Error creating academic year:', error);
    return res.status(500).json({
      message: 'Failed to create academic year',
      error: error.message
    });
  }
};

/**
 * Update an academic year
 */
export const updateAcademicYear = async (req: Request, res: Response) => {
  try {
    const parsed = updateAcademicYearSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.errors
      });
    }

    const yearId = req.params.id;
    const data = parsed.data;

    const academicYear = await AcademicYear.findById(yearId);
    if (!academicYear) {
      return res.status(404).json({ message: 'Academic year not found' });
    }

    // Validate dates if both are provided
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      if (end <= start) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }
    }

    Object.assign(academicYear, data);
    await academicYear.save();

    return res.status(200).json({
      message: 'Academic year updated successfully',
      academicYear
    });
  } catch (error: any) {
    console.error('Error updating academic year:', error);
    return res.status(500).json({
      message: 'Failed to update academic year',
      error: error.message
    });
  }
};

/**
 * Set an academic year as current
 */
export const setCurrentYear = async (req: Request, res: Response) => {
  try {
    const yearId = req.params.id;

    const academicYear = await AcademicYear.findById(yearId);
    if (!academicYear) {
      return res.status(404).json({ message: 'Academic year not found' });
    }

    // Set this year as current (pre-save hook will unset others)
    academicYear.isCurrent = true;
    await academicYear.save();

    return res.status(200).json({
      message: 'Current academic year set successfully',
      academicYear
    });
  } catch (error: any) {
    console.error('Error setting current year:', error);
    return res.status(500).json({
      message: 'Failed to set current year',
      error: error.message
    });
  }
};

/**
 * Delete an academic year
 */
export const deleteAcademicYear = async (req: Request, res: Response) => {
  try {
    const yearId = req.params.id;
    const academicYear = await AcademicYear.findById(yearId);

    if (!academicYear) {
      return res.status(404).json({ message: 'Academic year not found' });
    }

    // Check if this year is being used by any courses
    const { Course } = await import('../models/Course.ts');
    const coursesCount = await Course.countDocuments({ academicYearId: yearId });
    
    if (coursesCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete academic year. ${coursesCount} course(s) are associated with it.` 
      });
    }

    await AcademicYear.findByIdAndDelete(yearId);

    return res.status(200).json({ message: 'Academic year deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting academic year:', error);
    return res.status(500).json({
      message: 'Failed to delete academic year',
      error: error.message
    });
  }
};
