import { Schema, model, Types } from 'mongoose';
import { PROFILE_IMAGE_DEFAULT_URL } from '../constants/media.ts';
import { EMAIL_REGEX, NAME_MAX_LENGTH, PHONE_REGEX } from '../utils/validation.ts';

const SuperAdminSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    adminId: { type: String, required: true, unique: true, trim: true },
    firstName: { type: String, required: true, trim: true, maxlength: NAME_MAX_LENGTH },
    lastName: { type: String, required: true, trim: true, maxlength: NAME_MAX_LENGTH },
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other', 'unspecified'], default: 'unspecified' },
    email: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true, match: EMAIL_REGEX },
    instituteEmail: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true, match: EMAIL_REGEX },
    phone: { type: String, required: true, trim: true, match: PHONE_REGEX },
    addressId: { type: Types.ObjectId, ref: 'Address' },
    designation: { type: String, trim: true },
    department: { type: String, trim: true },
    joiningDate: { type: Date, default: Date.now },
    permissions: [{ type: String, trim: true }],
    accessLevel: { type: String, enum: ['full', 'restricted', 'view-only'], default: 'full' },
    profilePicture: { type: String, default: PROFILE_IMAGE_DEFAULT_URL },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    lastLoginAt: Date,
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: String,
    sessionTimeout: { type: Number, default: 3600 } // in seconds
  },
  { timestamps: true }
);

SuperAdminSchema.index({ status: 1 });
// Note: email already has an index via unique: true option
SuperAdminSchema.index({ permissions: 1 });

export const SuperAdmin = model('SuperAdmin', SuperAdminSchema);
