import { Schema, model, Types } from 'mongoose';

const SubjectSchema = new Schema(
  {
    subjectCode: { type: String, required: true, unique: true },
    subjectName: { type: String, required: true },
    description: String,
    credits: Number,
    branch: String,
    classesPerWeek: Number,
    semester: String,
    teacherId: { type: Types.ObjectId, ref: 'Teacher' },
    classId: { type: Types.ObjectId, ref: 'Class' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Subject = model('Subject', SubjectSchema);
