import { Schema, model, Types } from 'mongoose';
import { PROFILE_IMAGE_DEFAULT_STORAGE_PATH, PROFILE_IMAGE_DEFAULT_URL } from '../constants/media.ts';
import { BIO_MAX_LENGTH, NAME_MAX_LENGTH, PHONE_REGEX, isAllowedProfileUrl, URL_REGEX } from '../utils/validation.ts';

const UserProfileSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, unique: true },
    addressId: { type: Types.ObjectId, ref: 'Address' },
    displayName: { type: String, trim: true, maxlength: NAME_MAX_LENGTH },
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other', 'unspecified'], default: 'unspecified' },
    avatarUrl: { type: String, default: PROFILE_IMAGE_DEFAULT_URL, validate: [isAllowedProfileUrl, 'Invalid URL'] },
    profilePicture: {
      url: { type: String, default: PROFILE_IMAGE_DEFAULT_URL, validate: [isAllowedProfileUrl, 'Invalid URL'] },
      storagePath: { type: String, default: PROFILE_IMAGE_DEFAULT_STORAGE_PATH },
      isDefault: { type: Boolean, default: true },
      uploadedAt: Date
    },
    bio: { type: String, trim: true, maxlength: BIO_MAX_LENGTH },
    phone: { type: String, trim: true, match: PHONE_REGEX },
    emergencyContacts: [
      {
        name: { type: String, trim: true, maxlength: NAME_MAX_LENGTH },
        phone: { type: String, trim: true, match: PHONE_REGEX },
        relation: String,
        _id: false
      }
    ],
    socialLinks: [
      {
        platform: { type: String, trim: true },
        url: { type: String, trim: true, match: URL_REGEX },
        username: { type: String, trim: true },
        _id: false
      }
    ],
    settings: {
      theme: { type: String, enum: ['system', 'light', 'dark'], default: 'system' },
      language: { type: String, default: 'en' },
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true }
      }
    },
    preferences: { type: Map, of: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

UserProfileSchema.index({ gender: 1 });
UserProfileSchema.index({ addressId: 1 });

export const UserProfile = model('UserProfile', UserProfileSchema);
