import { Schema, model, Types } from 'mongoose';

const ClassSchema = new Schema(
  {
    className: { type: String, required: true },
    classCode: { type: String, required: true, unique: true },
    section: String,
    academicYear: String,
    classTeacherId: { type: Types.ObjectId, ref: 'Teacher' },
    capacity: Number,
    subjects: [{ type: Types.ObjectId, ref: 'Subject' }],
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const ClassModel = model('Class', ClassSchema);
