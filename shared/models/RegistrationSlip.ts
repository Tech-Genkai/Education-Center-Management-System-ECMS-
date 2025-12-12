import { Schema, model, Types } from 'mongoose';

const RegistrationSlipSchema = new Schema(
  {
    studentId: { type: Types.ObjectId, ref: 'Student', required: true },
    academicYear: { type: String, required: true },
    term: String,
    registrationNumber: { type: String, required: true, unique: true },
    subjects: [{ type: Types.ObjectId, ref: 'Subject' }],
    feeDue: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'issued', 'cancelled'], default: 'issued' },
    issuedAt: { type: Date, default: Date.now },
    createdBy: { type: Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const RegistrationSlip = model('RegistrationSlip', RegistrationSlipSchema);
