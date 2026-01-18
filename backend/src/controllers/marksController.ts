import type { Request, Response } from 'express';
import { Mark } from '../models/Mark.ts';
import { logActivity, getActorModel } from '../middleware/roleAuth.ts';

/**
 * Marks Controller - Full CRUD with grade calculation and activity logging
 */

/**
 * Get all marks (Admin only)
 * GET /api/marks
 */
export const getAllMarks = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const { classId, subjectId, examType, academicYear } = req.query;
    const filter: any = {};
    if (classId) filter.classId = classId;
    if (subjectId) filter.subjectId = subjectId;
    if (examType) filter.examType = examType;
    if (academicYear) filter.academicYear = academicYear;

    const [marks, total] = await Promise.all([
      Mark.find(filter)
        .populate('studentId', 'firstName lastName rollNumber')
        .populate('classId', 'name')
        .populate('subjectId', 'name')
        .populate('enteredBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Mark.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: marks,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    console.error('Error fetching marks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch marks', error: error.message });
  }
};

/**
 * Calculate grade from percentage
 */
const calculateGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

/**
 * Add marks for a student
 * POST /api/marks
 */
export const addMarks = async (req: Request, res: Response) => {
  try {
    const { studentId, subjectId, classId, examType, examName, maxMarks, obtainedMarks, examDate, academicYear, remarks } = req.body;
    const user = req.user!;

    const percentage = (obtainedMarks / maxMarks) * 100;
    const grade = calculateGrade(percentage);

    const mark = await Mark.create({
      studentId,
      subjectId,
      classId,
      examType,
      examName,
      maxMarks,
      obtainedMarks,
      percentage: parseFloat(percentage.toFixed(2)),
      grade,
      remarks,
      enteredBy: user._id,
      examDate: examDate ? new Date(examDate) : undefined,
      academicYear
    });

    // Log activity
    await logActivity({
      actor: user._id,
      actorModel: getActorModel(user.role),
      actorName: user.name,
      actorEmail: user.email,
      action: 'CREATE_MARKS',
      targetModel: 'Mark',
      targetId: mark._id.toString(),
      targetDescription: `Added ${examType} marks: ${obtainedMarks}/${maxMarks}`,
      details: { studentId, subjectId, examType, obtainedMarks, maxMarks, grade },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({ success: true, data: mark });
  } catch (error: any) {
    console.error('Error adding marks:', error);
    res.status(500).json({ success: false, message: 'Failed to add marks', error: error.message });
  }
};

/**
 * Add marks in bulk for multiple students
 * POST /api/marks/bulk
 */
export const addBulkMarks = async (req: Request, res: Response) => {
  try {
    const { classId, subjectId, examType, examName, maxMarks, examDate, academicYear, records } = req.body;
    // records: [{ studentId, obtainedMarks, remarks }]
    const user = req.user!;

    const marksRecords = records.map((r: any) => {
      const percentage = (r.obtainedMarks / maxMarks) * 100;
      return {
        studentId: r.studentId,
        subjectId,
        classId,
        examType,
        examName,
        maxMarks,
        obtainedMarks: r.obtainedMarks,
        percentage: parseFloat(percentage.toFixed(2)),
        grade: calculateGrade(percentage),
        remarks: r.remarks,
        enteredBy: user._id,
        examDate: examDate ? new Date(examDate) : undefined,
        academicYear
      };
    });

    const result = await Mark.insertMany(marksRecords, { ordered: false }).catch((err: any) => {
      if (err.insertedDocs) return err.insertedDocs;
      throw err;
    });

    // Log activity
    await logActivity({
      actor: user._id,
      actorModel: getActorModel(user.role),
      actorName: user.name,
      actorEmail: user.email,
      action: 'BULK_CREATE_MARKS',
      targetModel: 'Mark',
      targetDescription: `Bulk added ${examType} marks for ${records.length} students`,
      details: { classId, subjectId, examType, count: records.length },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      message: `Added marks for ${Array.isArray(result) ? result.length : records.length} students`,
      data: result
    });
  } catch (error: any) {
    console.error('Error bulk adding marks:', error);
    res.status(500).json({ success: false, message: 'Failed to add marks', error: error.message });
  }
};

/**
 * Get marks by student
 * GET /api/marks/student/:studentId
 */
export const getMarksByStudent = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { subjectId, examType, academicYear } = req.query;

    const filter: any = { studentId };
    if (subjectId) filter.subjectId = subjectId;
    if (examType) filter.examType = examType;
    if (academicYear) filter.academicYear = academicYear;

    const marks = await Mark.find(filter)
      .populate('subjectId', 'name')
      .populate('classId', 'name')
      .sort({ examDate: -1, createdAt: -1 })
      .lean();

    // Calculate overall stats
    const totalObtained = marks.reduce((sum, m) => sum + (m.obtainedMarks || 0), 0);
    const totalMax = marks.reduce((sum, m) => sum + (m.maxMarks || 0), 0);
    const overallPercentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) : '0';

    res.json({
      success: true,
      data: marks,
      stats: {
        totalExams: marks.length,
        totalObtained,
        totalMax,
        overallPercentage,
        overallGrade: calculateGrade(parseFloat(overallPercentage))
      }
    });
  } catch (error: any) {
    console.error('Error fetching student marks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch marks', error: error.message });
  }
};

/**
 * Update marks
 * PUT /api/marks/:id
 */
export const updateMarks = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { obtainedMarks, maxMarks, remarks } = req.body;
    const user = req.user!;

    const previous = await Mark.findById(id).lean();
    if (!previous) {
      return res.status(404).json({ success: false, message: 'Mark record not found' });
    }

    const updates: any = { remarks, enteredBy: user._id };
    if (obtainedMarks !== undefined) updates.obtainedMarks = obtainedMarks;
    if (maxMarks !== undefined) updates.maxMarks = maxMarks;

    // Recalculate percentage and grade if marks changed
    const newMax = maxMarks ?? previous.maxMarks;
    const newObtained = obtainedMarks ?? previous.obtainedMarks;
    if (newMax && newObtained !== undefined) {
      updates.percentage = parseFloat(((newObtained / newMax) * 100).toFixed(2));
      updates.grade = calculateGrade(updates.percentage);
    }

    const updated = await Mark.findByIdAndUpdate(id, updates, { new: true });

    // Log activity
    await logActivity({
      actor: user._id,
      actorModel: getActorModel(user.role),
      actorName: user.name,
      actorEmail: user.email,
      action: 'UPDATE_MARKS',
      targetModel: 'Mark',
      targetId: id,
      targetDescription: `Updated marks`,
      previousValue: { obtainedMarks: previous.obtainedMarks, grade: previous.grade },
      newValue: { obtainedMarks: updates.obtainedMarks, grade: updates.grade },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating marks:', error);
    res.status(500).json({ success: false, message: 'Failed to update marks', error: error.message });
  }
};

/**
 * Get marks report (Admin dashboard)
 * GET /api/marks/report
 */
export const getMarksReport = async (req: Request, res: Response) => {
  try {
    const { classId, examType, academicYear } = req.query;
    const filter: any = {};
    if (classId) filter.classId = classId;
    if (examType) filter.examType = examType;
    if (academicYear) filter.academicYear = academicYear;

    const [byGrade, byExamType, avgPercentage] = await Promise.all([
      Mark.aggregate([
        { $match: filter },
        { $group: { _id: '$grade', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Mark.aggregate([
        { $match: filter },
        { $group: { _id: '$examType', count: { $sum: 1 }, avgPercentage: { $avg: '$percentage' } } }
      ]),
      Mark.aggregate([
        { $match: filter },
        { $group: { _id: null, avg: { $avg: '$percentage' }, total: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalRecords: avgPercentage[0]?.total || 0,
        averagePercentage: avgPercentage[0]?.avg?.toFixed(2) || '0',
        gradeDistribution: Object.fromEntries(byGrade.map(g => [g._id, g.count])),
        byExamType: byExamType.map(e => ({
          examType: e._id,
          count: e.count,
          avgPercentage: e.avgPercentage?.toFixed(2)
        }))
      }
    });
  } catch (error: any) {
    console.error('Error fetching marks report:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch report', error: error.message });
  }
};
