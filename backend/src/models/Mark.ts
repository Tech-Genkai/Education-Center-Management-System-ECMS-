import { Schema, model, Types } from 'mongoose';

const MarkSchema = new Schema(
  {
    studentId: { type: Types.ObjectId, ref: 'Student', required: true },
    subjectId: { type: Types.ObjectId, ref: 'Subject', required: true },
    classId: { type: Types.ObjectId, ref: 'Class', required: true },
    examType: { type: String, enum: ['midterm', 'final', 'assignment', 'quiz_1', 'quiz_2'], required: true },
    examName: String,
    maxMarks: Number,
    obtainedMarks: Number,
    percentage: Number,
    grade: String,
    remarks: String,
    enteredBy: { type: Types.ObjectId, ref: 'Teacher' },
    examDate: Date,
    academicYear: String
  },
  { timestamps: true }
);

export const Mark = model('Mark', MarkSchema);
