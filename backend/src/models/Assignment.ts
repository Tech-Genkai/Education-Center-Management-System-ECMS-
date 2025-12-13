import { Schema, model, Types } from 'mongoose';

const AssignmentSchema = new Schema(
  {
    classId: { type: Types.ObjectId, ref: 'Class', required: true },
    subjectId: { type: Types.ObjectId, ref: 'Subject', required: true },
    subjectName: { type: String, required: true },
    teacherId: { type: Types.ObjectId, ref: 'Teacher', required: true },
    title: { type: String, required: true },
    description: String,
    attachments: [String],
    rubric: Object,
    dueDate: Date,
    totalMarks: Number,
    plagiarismCheck: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Assignment = model('Assignment', AssignmentSchema);
