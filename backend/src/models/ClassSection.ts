import { Schema, model, Types } from 'mongoose';

const ClassSectionSchema = new Schema(
  {
    classId: { type: Types.ObjectId, ref: 'Class', required: true },
    sectionName: { type: String, required: true },
    sectionCode: { type: String, required: true, unique: true },
    academicYear: String,
    classTeacherId: { type: Types.ObjectId, ref: 'Teacher' },
    capacity: Number,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const ClassSection = model('ClassSection', ClassSectionSchema);
