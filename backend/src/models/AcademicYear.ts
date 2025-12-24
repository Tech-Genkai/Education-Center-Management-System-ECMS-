import { Schema, model } from 'mongoose';

const AcademicYearSchema = new Schema(
  {
    year: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true,
      // Format: "2024-25", "2025-26", etc.
    },
    startDate: { 
      type: Date, 
      required: true 
    },
    endDate: { 
      type: Date, 
      required: true 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    isCurrent: { 
      type: Boolean, 
      default: false 
    },
    description: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Ensure only one academic year is marked as current at a time
AcademicYearSchema.pre('save', async function(next) {
  if (this.isCurrent) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { $set: { isCurrent: false } }
    );
  }
  next();
});

export const AcademicYear = model('AcademicYear', AcademicYearSchema);
