import { Schema, model, Types } from 'mongoose';

const EventSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    category: String,
    startDate: Date,
    endDate: Date,
    location: String,
    capacity: Number,
    requiresConsent: { type: Boolean, default: false },
    attachments: [String],
    createdBy: { type: Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export const Event = model('Event', EventSchema);
