import { Schema, model, Types } from "mongoose";
import { PROFILE_IMAGE_DEFAULT_URL } from "../constants/media.ts";
import { EMAIL_REGEX, NAME_MAX_LENGTH, PHONE_REGEX } from "../utils/validation.ts";

const StudentSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    studentId: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    instituteEmail: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    firstName: { type: String, trim: true, maxlength: NAME_MAX_LENGTH },
    lastName: { type: String, trim: true, maxlength: NAME_MAX_LENGTH },
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ["male", "female", "other", "unspecified"],
      default: "unspecified",
    },
    bloodGroup: String,
    addressId: { type: Types.ObjectId, ref: "Address" },
    guardianName: { type: String, trim: true, maxlength: NAME_MAX_LENGTH },
    guardianPhone: { type: String, trim: true, match: PHONE_REGEX },
    guardianEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: EMAIL_REGEX,
    },
    classId: { type: Types.ObjectId, ref: "Class" },
    section: { type: String, trim: true, maxlength: 20 },
    admissionDate: Date,
    registrationSlips: [{ type: Types.ObjectId, ref: "RegistrationSlip" }],
    profilePicture: { type: String, default: PROFILE_IMAGE_DEFAULT_URL },
    status: {
      type: String,
      enum: ["active", "inactive", "graduated"],
      default: "active",
    },
  },
  { timestamps: true }
);

StudentSchema.index({ status: 1 });
StudentSchema.index({ classId: 1, section: 1 });

export const Student = model("Student", StudentSchema);
