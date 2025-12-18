import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import { EMAIL_REGEX, PHONE_REGEX } from '../utils/validation.ts';

const SALT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 12;

export interface IUser extends Document {
  email: string;
  instituteEmail: string;
  phone: string;
  password: string;
  role: 'student' | 'teacher' | 'superadmin';
  isActive: boolean;
  lastLogin?: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true, match: EMAIL_REGEX },
    instituteEmail: { type: String, required: false, sparse: true, index: true, trim: true, lowercase: true, match: EMAIL_REGEX },
    phone: { type: String, required: true, trim: true, match: PHONE_REGEX },
    password: { type: String, required: true, minlength: 8 },
    role: { type: String, enum: ['student', 'teacher', 'superadmin'], required: true },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date }
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) return next();
    const hash = await bcrypt.hash(this.password, SALT_ROUNDS);
    this.password = hash;
    return next();
  } catch (err) {
    return next(err as Error);
  }
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  }
});

UserSchema.index({ role: 1, isActive: 1 });
// Note: email and instituteEmail already have indexes via unique: true option

export const User = model<IUser>('User', UserSchema);
