import { Schema, model, Types } from 'mongoose';

const AdmitCardSchema = new Schema(
  {
    studentId: { type: Types.ObjectId, ref: 'Student', required: true },
    examName: { type: String, required: true },
    examDate: { type: Date, required: true },
    hallTicketNumber: { type: String, required: true, unique: true },
    examSchedule: [
      {
        subjectId: { type: Types.ObjectId, ref: 'Subject' },
        subjectCode: String,
        subjectName: String,
        examDate: Date,
        startTime: String,
        endTime: String,
      }
    ],
    reportingTime: String,
    status: { type: String, enum: ['issued', 'revoked'], default: 'issued' },
    downloadUrl: String,
    createdBy: { type: Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export const AdmitCard = model('AdmitCard', AdmitCardSchema);
