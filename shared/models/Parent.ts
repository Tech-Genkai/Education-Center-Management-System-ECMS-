import { Schema, model, Types } from 'mongoose';

const ParentSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    guardianId: { type: String, required: true, unique: true },
    firstName: String,
    lastName: String,
    relationship: String,
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String, required: true },
    addressId: { type: Types.ObjectId, ref: 'Address' },
    wards: [{ type: Types.ObjectId, ref: 'Student' }],
    preferences: {
      communicationChannels: [String],
      language: String
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Parent = model('Parent', ParentSchema);
