import { Schema, model, Types } from 'mongoose';

const AssignmentSubmissionSchema = new Schema(
  {
    assignmentId: { type: Types.ObjectId, ref: 'Assignment', required: true },
    studentId: { type: Types.ObjectId, ref: 'Student', required: true },
    submittedAt: { type: Date, default: Date.now },
    content: { type: String }, // Text content of submission
    files: [String], // Legacy field
    attachments: [String], // File attachments
    status: { type: String, enum: ['submitted', 'late', 'missing', 'graded'], default: 'submitted' },
    grade: Number,
    marks: Number, // Same as grade, for compatibility
    feedback: String,
    plagiarismScore: Number,
    gradedBy: { type: Types.ObjectId, ref: 'Teacher' },
    gradedAt: { type: Date }
  },
  { timestamps: true }
);

AssignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export const AssignmentSubmission = model('AssignmentSubmission', AssignmentSubmissionSchema);

