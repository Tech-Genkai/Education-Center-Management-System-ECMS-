import { Schema, model, Types } from 'mongoose';

const SubjectSchema = new Schema(
  {
    subjectCode: { type: String, required: true, unique: true },
    subjectName: { type: String, required: true },
    description: String,
    credits: Number,
    teacherId: { type: Types.ObjectId, ref: 'Teacher' },
    classId: { type: Types.ObjectId, ref: 'Class' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Subject = model('Subject', SubjectSchema);
