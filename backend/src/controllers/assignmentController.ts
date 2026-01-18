import type { Request, Response } from 'express';
import { Assignment } from '../models/Assignment.ts';
import { AssignmentSubmission } from '../models/AssignmentSubmission.ts';
import { logActivity, getActorModel } from '../middleware/roleAuth.ts';

/**
 * Assignment Controller - Full CRUD with submissions and activity logging
 */

/**
 * Get all assignments (Admin only)
 * GET /api/assignments
 */
export const getAllAssignments = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const { classId, subjectId, teacherId, courseId, semester } = req.query;
    const filter: any = {};
    if (classId) filter.classId = classId;
    if (subjectId) filter.subjectId = subjectId;
    if (teacherId) filter.teacherId = teacherId;
    if (courseId) filter.courseId = courseId;
    if (semester) filter.semester = semester;

    const [assignments, total] = await Promise.all([
      Assignment.find(filter)
        .populate('classId', 'name')
        .populate('courseId', 'courseName') // Populate new field
        .populate('subjectId', 'name')
        .populate('teacherId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Assignment.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: assignments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch assignments', error: error.message });
  }
};

/**
 * Create assignment
 * POST /api/assignments
 */
export const createAssignment = async (req: Request, res: Response) => {
  try {
    const { classId, subjectId, subjectName, title, description, attachments, rubric, dueDate, totalMarks, plagiarismCheck } = req.body;
    const user = req.user!;

    const assignment = await Assignment.create({
      classId,
      subjectId,
      subjectName,
      teacherId: user._id,
      title,
      description,
      attachments,
      rubric,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      totalMarks,
      plagiarismCheck
    });

    // Log activity
    await logActivity({
      actor: user._id,
      actorModel: getActorModel(user.role),
      actorName: user.name,
      actorEmail: user.email,
      action: 'CREATE_ASSIGNMENT',
      targetModel: 'Assignment',
      targetId: assignment._id.toString(),
      targetDescription: `Created assignment: ${title}`,
      details: { classId, subjectId, title, dueDate, totalMarks },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ success: false, message: 'Failed to create assignment', error: error.message });
  }
};

/**
 * Get assignments by class
 * GET /api/assignments/class/:classId
 */
export const getAssignmentsByClass = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { subjectId } = req.query;

    const filter: any = { classId };
    if (subjectId) filter.subjectId = subjectId;

    const assignments = await Assignment.find(filter)
      .populate('subjectId', 'name')
      .populate('teacherId', 'firstName lastName')
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    res.json({ success: true, data: assignments });
  } catch (error: any) {
    console.error('Error fetching class assignments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch assignments', error: error.message });
  }
};

/**
 * Get assignments by teacher
 * GET /api/assignments/teacher/:teacherId
 */
export const getAssignmentsByTeacher = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.params;

    const assignments = await Assignment.find({ teacherId })
      .populate('classId', 'name')
      .populate('subjectId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: assignments });
  } catch (error: any) {
    console.error('Error fetching teacher assignments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch assignments', error: error.message });
  }
};

/**
 * Update assignment
 * PUT /api/assignments/:id
 */
export const updateAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const user = req.user!;

    const previous = await Assignment.findById(id).lean();
    if (!previous) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (updates.dueDate) updates.dueDate = new Date(updates.dueDate);

    const updated = await Assignment.findByIdAndUpdate(id, updates, { new: true });

    // Log activity
    await logActivity({
      actor: user._id,
      actorModel: getActorModel(user.role),
      actorName: user.name,
      actorEmail: user.email,
      action: 'UPDATE_ASSIGNMENT',
      targetModel: 'Assignment',
      targetId: id,
      targetDescription: `Updated assignment: ${previous.title}`,
      previousValue: { title: previous.title, dueDate: previous.dueDate },
      newValue: { title: updates.title, dueDate: updates.dueDate },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ success: false, message: 'Failed to update assignment', error: error.message });
  }
};

/**
 * Delete assignment
 * DELETE /api/assignments/:id
 */
export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    await Assignment.findByIdAndDelete(id);
    // Also delete related submissions
    await AssignmentSubmission.deleteMany({ assignmentId: id });

    // Log activity
    await logActivity({
      actor: user._id,
      actorModel: getActorModel(user.role),
      actorName: user.name,
      actorEmail: user.email,
      action: 'DELETE_ASSIGNMENT',
      targetModel: 'Assignment',
      targetId: id,
      targetDescription: `Deleted assignment: ${assignment.title}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ success: false, message: 'Failed to delete assignment', error: error.message });
  }
};

/**
 * Submit assignment (Student)
 * POST /api/assignments/:id/submit
 */
export const submitAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, attachments } = req.body;
    const user = req.user!;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Check if already submitted
    const existing = await AssignmentSubmission.findOne({
      assignmentId: id,
      studentId: user._id
    });

    if (existing) {
      // Update existing submission
      existing.content = content;
      existing.attachments = attachments;
      existing.submittedAt = new Date();
      existing.status = 'submitted';
      await existing.save();

      res.json({ success: true, message: 'Submission updated', data: existing });
    } else {
      // Create new submission
      const submission = await AssignmentSubmission.create({
        assignmentId: id,
        studentId: user._id,
        content,
        attachments,
        submittedAt: new Date(),
        status: 'submitted'
      });

      // Log activity
      await logActivity({
        actor: user._id,
        actorModel: 'Student',
        actorName: user.name,
        actorEmail: user.email,
        action: 'SUBMIT_ASSIGNMENT',
        targetModel: 'AssignmentSubmission',
        targetId: submission._id.toString(),
        targetDescription: `Submitted assignment: ${assignment.title}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      res.status(201).json({ success: true, message: 'Assignment submitted', data: submission });
    }
  } catch (error: any) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ success: false, message: 'Failed to submit assignment', error: error.message });
  }
};

/**
 * Get submissions for an assignment (Teacher/Admin)
 * GET /api/assignments/:id/submissions
 */
export const getSubmissions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const submissions = await AssignmentSubmission.find({ assignmentId: id })
      .populate('studentId', 'firstName lastName rollNumber email')
      .sort({ submittedAt: -1 })
      .lean();

    res.json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch submissions', error: error.message });
  }
};

/**
 * Grade a submission (Teacher/Admin)
 * POST /api/assignments/:id/submissions/:submissionId/grade
 */
export const gradeSubmission = async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { marks, feedback } = req.body;
    const user = req.user!;

    const submission = await AssignmentSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    submission.marks = marks;
    submission.feedback = feedback;
    submission.gradedBy = user._id as any;
    submission.gradedAt = new Date();
    submission.status = 'graded';
    await submission.save();

    // Log activity
    await logActivity({
      actor: user._id,
      actorModel: getActorModel(user.role),
      actorName: user.name,
      actorEmail: user.email,
      action: 'GRADE_SUBMISSION',
      targetModel: 'AssignmentSubmission',
      targetId: submissionId,
      targetDescription: `Graded submission: ${marks} marks`,
      details: { marks, feedback },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ success: true, message: 'Submission graded', data: submission });
  } catch (error: any) {
    console.error('Error grading submission:', error);
    res.status(500).json({ success: false, message: 'Failed to grade submission', error: error.message });
  }
};
