import { Schema, model, Types } from 'mongoose';
import { PROFILE_IMAGE_DEFAULT_URL } from '../constants/media.ts';
import { EMAIL_REGEX, NAME_MAX_LENGTH, PHONE_REGEX } from '../utils/validation.ts';

const TeacherSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    teacherId: { type: String, required: true, unique: true, trim: true },
    firstName: { type: String, trim: true, maxlength: NAME_MAX_LENGTH },
    lastName: { type: String, trim: true, maxlength: NAME_MAX_LENGTH },
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other', 'unspecified'], default: 'unspecified' },
    email: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true, match: EMAIL_REGEX },
    instituteEmail: { type: String, required: true, unique: true , index: true, trim: true, lowercase: true, match: EMAIL_REGEX },
    phone: { type: String, required: true, trim: true, match: PHONE_REGEX },
    addressId: { type: Types.ObjectId, ref: 'Address' },
    qualification: String,
    experience: Number,
    joiningDate: Date,
    subjects: [{ type: Types.ObjectId, ref: 'Subject' }],
    classes: [{ type: Types.ObjectId, ref: 'Class' }],
    salary: Number,
    profilePicture: { type: String, default: PROFILE_IMAGE_DEFAULT_URL },
    status: { type: String, enum: ['active', 'inactive', 'onleave'], default: 'active' }
  },
  { timestamps: true }
);

TeacherSchema.index({ status: 1 });
TeacherSchema.index({ subjects: 1 });

export const Teacher = model('Teacher', TeacherSchema);
