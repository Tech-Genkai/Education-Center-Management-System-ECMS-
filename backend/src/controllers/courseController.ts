import type { Request, Response } from 'express';
import { z } from 'zod';
import { Course } from '../models/Course.ts';
import { Semester } from '../models/Semester.ts';
import { AcademicYear } from '../models/AcademicYear.ts';
import bcrypt from 'bcrypt';

// Zod Schemas
const createCourseSchema = z.object({
  courseCode: z.string().min(1).max(20).trim(),
  courseName: z.string().min(1).max(100).trim(),
  totalSemesters: z.number().int().min(1).max(10),
  academicYearId: z.string().min(1).optional(), // Made optional since we accept academicYear string
  description: z.string().optional(),
  isActive: z.boolean().optional()
});

const updateCourseSchema = createCourseSchema.partial().omit({ courseCode: true, academicYearId: true });

/**
 * Get all courses with filters
 */
export const getCourses = async (req: Request, res: Response) => {
  try {
    const { academicYear, status, search, page = 1, limit = 50 } = req.query;

    const filter: any = {};

    // Filter by academic year
    if (academicYear) {
      filter.academicYearId = academicYear;
    }

    // Filter by status
    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }

    // Search by name, code, or description
    if (search && typeof search === 'string') {
      filter.$or = [
        { courseName: { $regex: search, $options: 'i' } },
        { courseCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [courses, totalCount] = await Promise.all([
      Course.find(filter)
        .populate('academicYearId', 'year')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Course.countDocuments(filter)
    ]);

    // Get semester count for each course
    const coursesWithSemesterCount = await Promise.all(
      courses.map(async (course) => {
        const semesterCount = await Semester.countDocuments({ courseId: course._id });
        return { ...course, semesterCount };
      })
    );

    return res.status(200).json({
      courses: coursesWithSemesterCount,
      pagination: {
        total: totalCount,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(totalCount / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching courses:', error);
    return res.status(500).json({
      message: 'Failed to fetch courses',
      error: error.message
    });
  }
};

/**
 * Get course by ID
 */
export const getCourseById = async (req: Request, res: Response) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId)
      .populate('academicYearId', 'year startDate endDate');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get all semesters for this course
    const semesters = await Semester.find({ courseId })
      .populate('subjects.subjectId', 'subjectCode subjectName')
      .populate('subjects.teacherId', 'firstName lastName')
      .sort({ semesterNumber: 1 });

    return res.status(200).json({ course, semesters });
  } catch (error: any) {
    console.error('Error fetching course:', error);
    return res.status(500).json({
      message: 'Failed to fetch course',
      error: error.message
    });
  }
};

/**
 * Create a new course
 */
export const createCourse = async (req: Request, res: Response) => {
  try {
    const parsed = createCourseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.errors
      });
    }

    const data = parsed.data;
    
    // Handle academicYear string - find or create the academic year
    let academicYearId = data.academicYearId;
    
    // If academicYear string is provided instead of ID, find or create it
    if (req.body.academicYear && typeof req.body.academicYear === 'string') {
      const yearString = req.body.academicYear.trim();
      
      // Validate format (YYYY-YY)
      if (!/^\d{4}-\d{2}$/.test(yearString)) {
        return res.status(400).json({ 
          message: 'Invalid academic year format. Use YYYY-YY (e.g., 2024-25)' 
        });
      }
      
      // Find or create academic year
      let academicYear = await AcademicYear.findOne({ year: yearString });
      
      if (!academicYear) {
        // Auto-create academic year
        const startYear = parseInt(yearString.substring(0, 4));
        const endYear = parseInt('20' + yearString.substring(5, 7));
        
        academicYear = new AcademicYear({
          year: yearString,
          startDate: new Date(startYear, 3, 1), // April 1st
          endDate: new Date(endYear, 2, 31), // March 31st
          isActive: true,
          isCurrent: false // Don't auto-set as current
        });
        await academicYear.save();
      }
      
      academicYearId = academicYear._id.toString();
    } else {
      // Verify academic year exists
      const academicYear = await AcademicYear.findById(academicYearId);
      if (!academicYear) {
        return res.status(400).json({ message: 'Academic year not found' });
      }
    }

    // Check if course code already exists for this academic year
    const existingCourse = await Course.findOne({
      courseCode: data.courseCode,
      academicYearId: academicYearId
    });
    if (existingCourse) {
      return res.status(400).json({ 
        message: 'Course code already exists for this academic year' 
      });
    }

    const newCourse = new Course({
      courseCode: data.courseCode,
      courseName: data.courseName,
      totalSemesters: data.totalSemesters,
      academicYearId: academicYearId,
      description: data.description,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdBy: req.user?.userId
    });
    await newCourse.save();

    // Auto-create semesters based on totalSemesters
    const semesterPromises = [];
    for (let i = 1; i <= data.totalSemesters; i++) {
      const semester = new Semester({
        semesterNumber: i,
        courseId: newCourse._id,
        subjects: []
      });
      semesterPromises.push(semester.save());
    }
    await Promise.all(semesterPromises);

    return res.status(201).json({
      message: 'Course created successfully',
      course: newCourse
    });
  } catch (error: any) {
    console.error('Error creating course:', error);
    return res.status(500).json({
      message: 'Failed to create course',
      error: error.message
    });
  }
};

/**
 * Update a course
 */
export const updateCourse = async (req: Request, res: Response) => {
  try {
    const parsed = updateCourseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.errors
      });
    }

    const courseId = req.params.id;
    const data = parsed.data;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // If totalSemesters is being updated
    if (data.totalSemesters && data.totalSemesters !== course.totalSemesters) {
      const currentSemesterCount = await Semester.countDocuments({ courseId });
      
      if (data.totalSemesters > currentSemesterCount) {
        // Add new semesters
        const semesterPromises = [];
        for (let i = currentSemesterCount + 1; i <= data.totalSemesters; i++) {
          const semester = new Semester({
            semesterNumber: i,
            courseId: course._id,
            subjects: []
          });
          semesterPromises.push(semester.save());
        }
        await Promise.all(semesterPromises);
      } else if (data.totalSemesters < currentSemesterCount) {
        // Remove extra semesters
        await Semester.deleteMany({
          courseId,
          semesterNumber: { $gt: data.totalSemesters }
        });
      }
    }

    Object.assign(course, data);
    await course.save();

    return res.status(200).json({
      message: 'Course updated successfully',
      course
    });
  } catch (error: any) {
    console.error('Error updating course:', error);
    return res.status(500).json({
      message: 'Failed to update course',
      error: error.message
    });
  }
};

/**
 * Toggle course status (active/inactive)
 */
export const toggleCourseStatus = async (req: Request, res: Response) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    course.isActive = !course.isActive;
    await course.save();

    return res.status(200).json({
      message: `Course ${course.isActive ? 'activated' : 'deactivated'} successfully`,
      course
    });
  } catch (error: any) {
    console.error('Error toggling course status:', error);
    return res.status(500).json({
      message: 'Failed to toggle course status',
      error: error.message
    });
  }
};

/**
 * Delete a course (with password verification)
 */
export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const courseId = req.params.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Verify admin password
    const { SuperAdmin } = await import('../models/SuperAdmin.ts');
    const admin = await SuperAdmin.findOne({ userId: req.user?.userId });
    
    if (!admin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Delete all associated semesters
    await Semester.deleteMany({ courseId });

    // Delete the course
    await Course.findByIdAndDelete(courseId);

    return res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting course:', error);
    return res.status(500).json({
      message: 'Failed to delete course',
      error: error.message
    });
  }
};

/**
 * Get course statistics for dashboard
 */
export const getCourseStatistics = async (req: Request, res: Response) => {
  try {
    const { academicYearId } = req.query;

    const filter: any = {};
    if (academicYearId) {
      filter.academicYearId = academicYearId;
    }

    const [totalCourses, activeCourses, inactiveCourses, coursesByYear] = await Promise.all([
      Course.countDocuments(filter),
      Course.countDocuments({ ...filter, isActive: true }),
      Course.countDocuments({ ...filter, isActive: false }),
      Course.aggregate([
        ...(academicYearId ? [{ $match: { academicYearId } }] : []),
        {
          $group: {
            _id: '$academicYearId',
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'academicyears',
            localField: '_id',
            foreignField: '_id',
            as: 'academicYear'
          }
        },
        {
          $unwind: '$academicYear'
        },
        {
          $project: {
            year: '$academicYear.year',
            count: 1
          }
        }
      ])
    ]);

    return res.status(200).json({
      statistics: {
        total: totalCourses,
        active: activeCourses,
        inactive: inactiveCourses,
        byYear: coursesByYear
      }
    });
  } catch (error: any) {
    console.error('Error fetching statistics:', error);
    return res.status(500).json({
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};
