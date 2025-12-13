import { Schema, model, Types } from 'mongoose';

const GrievanceSchema = new Schema(
  {
    submittedByType: { type: String, enum: ['student', 'parent', 'teacher'], required: true },
    submittedById: { type: Types.ObjectId, required: true },
    category: String,
    priority: String,
    description: String,
    attachments: [String],
    assignedTo: { type: Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
    slaDueAt: Date,
    resolutionSummary: String,
    satisfactionScore: Number
  },
  { timestamps: true }
);

export const Grievance = model('Grievance', GrievanceSchema);
