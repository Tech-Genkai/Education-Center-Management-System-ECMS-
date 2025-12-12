import { Schema, model, Types } from 'mongoose';

const FeeSchema = new Schema(
  {
    studentId: { type: Types.ObjectId, ref: 'Student', required: true },
    academicYear: String,
    feeType: { type: String, enum: ['tuition', 'transport', 'hostel', 'exam', 'other'], required: true },
    amountDue: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    dueDate: Date,
    status: { type: String, enum: ['pending', 'partial', 'paid', 'overdue'], default: 'pending' },
    invoiceNumber: { type: String, unique: true },
    paymentPlanId: { type: Types.ObjectId, ref: 'PaymentPlan' },
    automatedReminderCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Fee = model('Fee', FeeSchema);
