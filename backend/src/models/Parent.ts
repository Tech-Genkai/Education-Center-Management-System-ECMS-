import { Schema, model, Types } from 'mongoose';
import { EMAIL_REGEX, PHONE_REGEX, NAME_MAX_LENGTH } from '../utils/validation.ts';

const ParentSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    guardianId: { type: String, required: true, unique: true },
    firstName: { type: String, trim: true, maxlength: NAME_MAX_LENGTH },
    lastName: { type: String, trim: true, maxlength: NAME_MAX_LENGTH },
    relationship: { type: String, trim: true, maxlength: NAME_MAX_LENGTH },
    email: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true, match: EMAIL_REGEX },
    phone: { type: String, required: true, trim: true, match: PHONE_REGEX },
    addressId: { type: Types.ObjectId, ref: 'Address' },
    wards: [{ type: Types.ObjectId, ref: 'Student' }],
    preferences: {
      communicationChannels: [String],
      language: String
    }
  },
  { timestamps: true }
);

export const Parent = model('Parent', ParentSchema);
