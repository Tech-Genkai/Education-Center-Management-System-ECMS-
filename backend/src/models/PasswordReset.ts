import { Schema, model, Document, Types } from 'mongoose';

export interface IPasswordReset extends Document {
  userId: Types.ObjectId;
  email: string;
  otp: string;
  resetToken?: string;
  expiresAt: Date;
  isUsed: boolean;
  attempts: number;
  createdAt: Date;
}

const PasswordResetSchema = new Schema<IPasswordReset>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    email: { 
      type: String, 
      required: true, 
      lowercase: true, 
      trim: true 
    },
    otp: { 
      type: String, 
      required: true 
    },
    resetToken: { 
      type: String 
    },
    expiresAt: { 
      type: Date, 
      required: true
    },
    isUsed: { 
      type: Boolean, 
      default: false 
    },
    attempts: { 
      type: Number, 
      default: 0 
    }
  },
  { 
    timestamps: true 
  }
);

// Index for faster queries
PasswordResetSchema.index({ email: 1, isUsed: 1 });
PasswordResetSchema.index({ resetToken: 1 });
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion

export const PasswordReset = model<IPasswordReset>('PasswordReset', PasswordResetSchema);
