import { Schema, model, Types } from 'mongoose';

const SyllabusSchema = new Schema(
  {
    subjectId: { type: Types.ObjectId, ref: 'Subject', required: true },
    classId: { type: Types.ObjectId, ref: 'Class' },
    academicYear: String,
    version: { type: String, default: 'v1' },
    topics: [
      {
        title: String,
        description: String,
        week: Number,
        resources: [String]
      }
    ],
    attachments: [String],
    createdBy: { type: Types.ObjectId, ref: 'Teacher' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Syllabus = model('Syllabus', SyllabusSchema);
