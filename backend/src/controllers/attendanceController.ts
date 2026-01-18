import type { Request, Response } from 'express';
import { Attendance } from '../models/Attendance.ts';
import { logActivity, getActorModel } from '../middleware/roleAuth.ts';

/**
 * Attendance Controller - Full CRUD with activity logging
 */

/**
 * Get all attendance records (Admin only)
 * GET /api/attendance
 */
export const getAllAttendance = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Optional filters
    const { classId, subjectId, date, status } = req.query;
    const filter: any = {};
    if (classId) filter.classId = classId;
    if (subjectId) filter.subjectId = subjectId;
    if (status) filter.status = status;
    if (date) {
      const d = new Date(date as string);
      filter.date = {
        $gte: new Date(d.setHours(0, 0, 0, 0)),
        $lt: new Date(d.setHours(23, 59, 59, 999))
      };
    }

    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .populate('studentId', 'firstName lastName rollNumber')
        .populate('classId', 'name')
        .populate('subjectId', 'name')
        .populate('markedBy', 'firstName lastName')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Attendance.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: records,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attendance', error: error.message });
  }
};

/**
 * Mark single attendance
 * POST /api/attendance
 */
export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { studentId, classId, subjectId, date, status, remarks, academicYear } = req.body;
    const user = req.user!;

    const attendance = await Attendance.create({
      studentId,
      classId,
      subjectId,
      date: new Date(date),
      status,
      remarks,
      markedBy: user._id,
      academicYear
    });

    // Log activity
    await logActivity({
      actor: user._id,
      actorModel: getActorModel(user.role),
      actorName: user.name,
      actorEmail: user.email,
      action: 'CREATE_ATTENDANCE',
      targetModel: 'Attendance',
      targetId: attendance._id.toString(),
      targetDescription: `Marked ${status} for student`,
      details: { studentId, classId, subjectId, date, status },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({ success: true, data: attendance });
  } catch (error: any) {
    console.error('Error marking attendance:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Attendance already marked for this student on this date/subject' });
    }
    res.status(500).json({ success: false, message: 'Failed to mark attendance', error: error.message });
  }
};

/**
 * Bulk mark attendance for a class
 * POST /api/attendance/bulk
 */
export const markBulkAttendance = async (req: Request, res: Response) => {
  try {
    const { classId, courseId, semester, subjectId, date, academicYear, records } = req.body;
    // records: [{ studentId, status, remarks }]
    const user = req.user!;

    const attendanceRecords = records.map((r: any) => ({
      studentId: r.studentId,
      classId,
      courseId,
      semester,
      subjectId,
      date: new Date(date),
      status: r.status,
      remarks: r.remarks,
      markedBy: user._id,
      academicYear
    }));

    const result = await Attendance.insertMany(attendanceRecords, { ordered: false }).catch((err: any) => {
      // Handle partial success
      if (err.insertedDocs) return err.insertedDocs;
      throw err;
    });

    // Log activity
    await logActivity({
      actor: user._id,
      actorModel: getActorModel(user.role),
      actorName: user.name,
      actorEmail: user.email,
      action: 'BULK_CREATE_ATTENDANCE',
      targetModel: 'Attendance',
      targetDescription: `Bulk marked attendance for ${records.length} students`,
      details: { classId, subjectId, date, count: records.length },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({ 
      success: true, 
      message: `Marked attendance for ${Array.isArray(result) ? result.length : records.length} students`,
      data: result
    });
  } catch (error: any) {
    console.error('Error bulk marking attendance:', error);
    res.status(500).json({ success: false, message: 'Failed to bulk mark attendance', error: error.message });
  }
};

/**
 * Get attendance by student
 * GET /api/attendance/student/:studentId
 */
export const getAttendanceByStudent = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { subjectId, startDate, endDate } = req.query;

    const filter: any = { studentId };
    if (subjectId) filter.subjectId = subjectId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    const records = await Attendance.find(filter)
      .populate('classId', 'name')
      .populate('subjectId', 'name')
      .populate('markedBy', 'firstName lastName')
      .sort({ date: -1 })
      .lean();

    // Calculate stats
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const percentage = total > 0 ? ((present + late) / total * 100).toFixed(2) : '0';

    res.json({
      success: true,
      data: records,
      stats: { total, present, absent, late, percentage }
    });
  } catch (error: any) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attendance', error: error.message });
  }
};

/**
 * Get attendance by class for a specific date
 * GET /api/attendance/class/:classId
 */
export const getAttendanceByClass = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { date, subjectId } = req.query;

    const filter: any = { classId };
    if (subjectId) filter.subjectId = subjectId;
    if (date) {
      const d = new Date(date as string);
      filter.date = {
        $gte: new Date(d.setHours(0, 0, 0, 0)),
        $lt: new Date(d.setHours(23, 59, 59, 999))
      };
    }

    const records = await Attendance.find(filter)
      .populate('studentId', 'firstName lastName rollNumber email')
      .populate('subjectId', 'name')
      .populate('markedBy', 'firstName lastName')
      .sort({ 'studentId.rollNumber': 1 })
      .lean();

    res.json({ success: true, data: records });
  } catch (error: any) {
    console.error('Error fetching class attendance:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attendance', error: error.message });
  }
};

/**
 * Update attendance record
 * PUT /api/attendance/:id
 */
export const updateAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const user = req.user!;

    const previous = await Attendance.findById(id).lean();
    if (!previous) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    const updated = await Attendance.findByIdAndUpdate(
      id,
      { status, remarks, markedBy: user._id },
      { new: true }
    ).populate('studentId', 'firstName lastName');

    // Log activity
    await logActivity({
      actor: user._id,
      actorModel: getActorModel(user.role),
      actorName: user.name,
      actorEmail: user.email,
      action: 'UPDATE_ATTENDANCE',
      targetModel: 'Attendance',
      targetId: id,
      targetDescription: `Updated attendance status`,
      previousValue: { status: previous.status, remarks: previous.remarks },
      newValue: { status, remarks },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ success: false, message: 'Failed to update attendance', error: error.message });
  }
};

/**
 * Get attendance statistics (Admin)
 * GET /api/attendance/stats
 */
export const getAttendanceStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, classId } = req.query;
    
    const matchStage: any = {};
    if (classId) matchStage.classId = classId;
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate as string);
      if (endDate) matchStage.date.$lte = new Date(endDate as string);
    }

    const stats = await Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = stats.reduce((sum, s) => sum + s.count, 0);
    const byStatus = Object.fromEntries(stats.map(s => [s._id, s.count]));

    res.json({
      success: true,
      data: {
        total,
        byStatus,
        overallPercentage: total > 0 
          ? (((byStatus.present || 0) + (byStatus.late || 0)) / total * 100).toFixed(2)
          : '0'
      }
    });
  } catch (error: any) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats', error: error.message });
  }
};
