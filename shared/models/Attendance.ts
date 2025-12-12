import { Schema, model, Types } from 'mongoose';

const AttendanceSchema = new Schema(
  {
    studentId: { type: Types.ObjectId, ref: 'Student', required: true },
    classId: { type: Types.ObjectId, ref: 'Class', required: true },
    subjectId: { type: Types.ObjectId, ref: 'Subject', required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent', 'late', 'excused', 'leave'], required: true },
    remarks: String,
    markedBy: { type: Types.ObjectId, ref: 'Teacher' },
    academicYear: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Attendance = model('Attendance', AttendanceSchema);
