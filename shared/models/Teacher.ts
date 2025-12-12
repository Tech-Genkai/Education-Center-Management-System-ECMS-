import { Schema, model, Types } from 'mongoose';

const TeacherSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    teacherId: { type: String, required: true, unique: true },
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    gender: String,
    email: { type: String, required: true, unique: true, index: true },
    instituteEmail: { type: String, required: true, unique: true , index: true},
    phone: { type: String, required: true },
    addressId: { type: Types.ObjectId, ref: 'Address' },
    qualification: String,
    experience: Number,
    joiningDate: Date,
    subjects: [{ type: Types.ObjectId, ref: 'Subject' }],
    classes: [{ type: Types.ObjectId, ref: 'Class' }],
    salary: Number,
    profilePicture: String,
    status: { type: String, enum: ['active', 'inactive', 'onleave'], default: 'active' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Teacher = model('Teacher', TeacherSchema);
