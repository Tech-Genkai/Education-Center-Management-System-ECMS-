import { Schema, model, Types } from 'mongoose';

const GrievanceCommentSchema = new Schema(
  {
    grievanceId: { type: Types.ObjectId, ref: 'Grievance', required: true },
    authorId: { type: Types.ObjectId, ref: 'User', required: true },
    comment: String,
    visibility: { type: String, enum: ['public', 'internal'], default: 'public' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const GrievanceComment = model('GrievanceComment', GrievanceCommentSchema);
