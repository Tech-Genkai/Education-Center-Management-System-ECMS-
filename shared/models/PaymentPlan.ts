import { Schema, model } from 'mongoose';

const PaymentPlanSchema = new Schema(
  {
    name: { type: String, required: true },
    description: String,
    frequency: { type: String, enum: ['monthly', 'quarterly', 'annually'], required: true },
    amount: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 },
    autoDebit: { type: Boolean, default: false },
    gracePeriodDays: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const PaymentPlan = model('PaymentPlan', PaymentPlanSchema);
