import { Schema, model, Types } from 'mongoose';

const UserProfileSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, unique: true },
    avatarUrl: String,
    bio: String,
    phone: String,
    emergencyContacts: [
      {
        name: String,
        phone: String,
        relation: String
      }
    ],
    preferences: Object,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const UserProfile = model('UserProfile', UserProfileSchema);
