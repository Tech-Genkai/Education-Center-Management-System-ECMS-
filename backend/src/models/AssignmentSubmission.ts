import { Schema, model, Types } from 'mongoose';

const AssignmentSubmissionSchema = new Schema(
  {
    assignmentId: { type: Types.ObjectId, ref: 'Assignment', required: true },
    studentId: { type: Types.ObjectId, ref: 'Student', required: true },
    submittedAt: { type: Date, default: Date.now },
    files: [String],
    status: { type: String, enum: ['submitted', 'late', 'missing'], default: 'submitted' },
    grade: Number,
    feedback: String,
    plagiarismScore: Number
  },
  { timestamps: true }
);

AssignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export const AssignmentSubmission = model('AssignmentSubmission', AssignmentSubmissionSchema);
