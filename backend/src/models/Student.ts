import { Schema, model, Types } from 'mongoose';

const StudentSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    studentId: { type: String, required: true, unique: true },
    firstName: String,
    lastName: String,
    dateOfBirth: { type: String },
    gender: String,
    bloodGroup: String,
    email: { type: String, required: true, unique: true, index: true },
    instituteEmail: { type: String, required: true, unique: true , index: true},
    phone: { type: String, required: true },
    addressId: { type: Types.ObjectId, ref: 'Address' },
    guardianName: String,
    guardianPhone: String,
    guardianEmail: String,
    classId: { type: Types.ObjectId, ref: 'Class' },
    section: String,
    admissionDate: Date,
    profilePicture: String,
    status: { type: String, enum: ['active', 'inactive', 'graduated'], default: 'active' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Student = model('Student', StudentSchema);
