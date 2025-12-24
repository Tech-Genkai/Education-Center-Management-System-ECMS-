import type { Request, Response } from 'express';
import { z } from 'zod';
import { Semester } from '../models/Semester.ts';
import { Course } from '../models/Course.ts';
import { Subject } from '../models/Subject.ts';
import { Teacher } from '../models/Teacher.ts';

// Zod Schemas
const assignSubjectTeacherSchema = z.object({
  subjectId: z.string().min(1),
  teacherId: z.string().optional()
});

/**
 * Get all semesters for a course
 */
export const getSemestersByCourse = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    const semesters = await Semester.find({ courseId })
      .populate('subjects.subjectId', 'subjectCode subjectName credits')
      .populate('subjects.teacherId', 'firstName lastName email')
      .sort({ semesterNumber: 1 });

    return res.status(200).json({ semesters });
  } catch (error: any) {
    console.error('Error fetching semesters:', error);
    return res.status(500).json({
      message: 'Failed to fetch semesters',
      error: error.message
    });
  }
};

/**
 * Get semester by ID
 */
export const getSemesterById = async (req: Request, res: Response) => {
  try {
    const semesterId = req.params.id;
    const semester = await Semester.findById(semesterId)
      .populate('courseId', 'courseName courseCode')
      .populate('subjects.subjectId', 'subjectCode subjectName credits')
      .populate('subjects.teacherId', 'firstName lastName email');

    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }

    return res.status(200).json({ semester });
  } catch (error: any) {
    console.error('Error fetching semester:', error);
    return res.status(500).json({
      message: 'Failed to fetch semester',
      error: error.message
    });
  }
};

/**
 * Assign subject and teacher to a semester
 */
export const assignSubjectTeacher = async (req: Request, res: Response) => {
  try {
    const semesterId = req.params.id;
    const parsed = assignSubjectTeacherSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.errors
      });
    }

    const { subjectId, teacherId } = parsed.data;

    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }

    // Verify subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(400).json({ message: 'Subject not found' });
    }

    // Verify teacher exists if provided
    if (teacherId) {
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return res.status(400).json({ message: 'Teacher not found' });
      }

      // Check teacher workload
      const workload = await getTeacherWorkloadCount(teacherId);
      if (workload >= 5) {
        return res.status(200).json({
          warning: true,
          message: `Teacher is already assigned to ${workload} subjects. Please confirm assignment.`,
          workload
        });
      }
    }

    // Check if subject already assigned to this semester
    const existingAssignment = semester.subjects.find(
      (s: any) => s.subjectId.toString() === subjectId
    );

    if (existingAssignment) {
      return res.status(400).json({ message: 'Subject already assigned to this semester' });
    }

    // Add assignment
    semester.subjects.push({
      subjectId: subjectId as any,
      teacherId: teacherId as any,
      assignedAt: new Date()
    });

    await semester.save();

    // Populate the response
    await semester.populate('subjects.subjectId', 'subjectCode subjectName');
    await semester.populate('subjects.teacherId', 'firstName lastName');

    return res.status(200).json({
      message: 'Subject and teacher assigned successfully',
      semester
    });
  } catch (error: any) {
    console.error('Error assigning subject/teacher:', error);
    return res.status(500).json({
      message: 'Failed to assign subject/teacher',
      error: error.message
    });
  }
};

/**
 * Remove subject-teacher assignment from semester
 */
export const removeSubjectTeacher = async (req: Request, res: Response) => {
  try {
    const { semesterId, assignmentId } = req.params;

    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }

    // Remove the assignment
    semester.subjects = semester.subjects.filter(
      (s: any) => s._id.toString() !== assignmentId
    );

    await semester.save();

    return res.status(200).json({
      message: 'Subject-teacher assignment removed successfully',
      semester
    });
  } catch (error: any) {
    console.error('Error removing assignment:', error);
    return res.status(500).json({
      message: 'Failed to remove assignment',
      error: error.message
    });
  }
};

/**
 * Update teacher assignment for a subject in semester
 */
export const updateTeacherAssignment = async (req: Request, res: Response) => {
  try {
    const { semesterId, assignmentId } = req.params;
    const { teacherId } = req.body;

    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }

    // Verify teacher exists
    if (teacherId) {
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return res.status(400).json({ message: 'Teacher not found' });
      }

      // Check teacher workload
      const workload = await getTeacherWorkloadCount(teacherId);
      if (workload >= 5) {
        return res.status(200).json({
          warning: true,
          message: `Teacher is already assigned to ${workload} subjects. Please confirm assignment.`,
          workload
        });
      }
    }

    // Find and update the assignment
    const assignment: any = semester.subjects.find(
      (s: any) => s._id.toString() === assignmentId
    );

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    assignment.teacherId = teacherId || null;
    assignment.assignedAt = new Date();

    await semester.save();

    // Populate the response
    await semester.populate('subjects.subjectId', 'subjectCode subjectName');
    await semester.populate('subjects.teacherId', 'firstName lastName');

    return res.status(200).json({
      message: 'Teacher assignment updated successfully',
      semester
    });
  } catch (error: any) {
    console.error('Error updating teacher assignment:', error);
    return res.status(500).json({
      message: 'Failed to update teacher assignment',
      error: error.message
    });
  }
};

/**
 * Get teacher workload (total subjects assigned)
 */
export const getTeacherWorkload = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.params;

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const workload = await getTeacherWorkloadCount(teacherId);

    // Get detailed breakdown
    const semesters = await Semester.find({
      'subjects.teacherId': teacherId
    })
      .populate('courseId', 'courseName courseCode')
      .populate('subjects.subjectId', 'subjectCode subjectName');

    const assignments = semesters.flatMap((semester: any) => {
      return semester.subjects
        .filter((s: any) => s.teacherId?.toString() === teacherId)
        .map((s: any) => ({
          semester: {
            _id: semester._id,
            number: semester.semesterNumber,
            course: semester.courseId
          },
          subject: s.subjectId,
          assignedAt: s.assignedAt
        }));
    });

    return res.status(200).json({
      teacher: {
        _id: teacher._id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        email: teacher.email
      },
      workload: {
        totalSubjects: workload,
        assignments
      }
    });
  } catch (error: any) {
    console.error('Error fetching teacher workload:', error);
    return res.status(500).json({
      message: 'Failed to fetch teacher workload',
      error: error.message
    });
  }
};

/**
 * Delete a semester
 */
export const deleteSemester = async (req: Request, res: Response) => {
  try {
    const semesterId = req.params.id;
    const semester = await Semester.findById(semesterId);

    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }

    // Check if semester has any assignments
    if (semester.subjects.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete semester with subject assignments. Remove all assignments first.'
      });
    }

    await Semester.findByIdAndDelete(semesterId);

    return res.status(200).json({ message: 'Semester deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting semester:', error);
    return res.status(500).json({
      message: 'Failed to delete semester',
      error: error.message
    });
  }
};

/**
 * Helper function to get teacher workload count
 */
async function getTeacherWorkloadCount(teacherId: string): Promise<number> {
  const semesters = await Semester.find({
    'subjects.teacherId': teacherId
  });

  let count = 0;
  semesters.forEach((semester: any) => {
    semester.subjects.forEach((s: any) => {
      if (s.teacherId?.toString() === teacherId) {
        count++;
      }
    });
  });

  return count;
}
