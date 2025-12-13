import { Schema, model, Types } from 'mongoose';

const PaymentSchema = new Schema(
  {
    feeId: { type: Types.ObjectId, ref: 'Fee', required: true },
    transactionId: { type: String, required: true, unique: true },
    gateway: String,
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    paidAt: Date,
    status: { type: String, enum: ['initiated', 'success', 'failed', 'refunded'], default: 'initiated' },
    receiptUrl: String,
    metadata: Object
  },
  { timestamps: true }
);

export const Payment = model('Payment', PaymentSchema);
