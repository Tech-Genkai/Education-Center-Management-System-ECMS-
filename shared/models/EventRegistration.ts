import { Schema, model, Types } from 'mongoose';

const EventRegistrationSchema = new Schema(
  {
    eventId: { type: Types.ObjectId, ref: 'Event', required: true },
    registrantType: { type: String, enum: ['student', 'teacher', 'parent'], required: true },
    registrantId: { type: Types.ObjectId, required: true },
    status: { type: String, enum: ['registered', 'waitlisted', 'cancelled', 'attended'], default: 'registered' },
    consentStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    checkInAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const EventRegistration = model('EventRegistration', EventRegistrationSchema);
