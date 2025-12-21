import { Schema, model, Types } from 'mongoose';
import { PROFILE_IMAGE_DEFAULT_URL } from '../constants/media.ts';
import { NAME_MAX_LENGTH } from '../utils/validation.ts';

const TeacherSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    teacherId: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true, unique: true },
    instituteEmail: { type: String, trim: true, lowercase: true },
    firstName: { type: String, trim: true, maxlength: NAME_MAX_LENGTH },
    lastName: { type: String, trim: true, maxlength: NAME_MAX_LENGTH },
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other', 'unspecified'], default: 'unspecified' },
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
