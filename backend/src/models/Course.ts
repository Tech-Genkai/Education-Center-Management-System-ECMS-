import { Schema, model, Types } from 'mongoose';

const CourseSchema = new Schema(
  {
    courseCode: { 
      type: String, 
      required: true,
      trim: true,
      uppercase: true
    },
    courseName: { 
      type: String, 
      required: true,
      trim: true
    },
    totalSemesters: { 
      type: Number, 
      required: true,
      min: 1,
      max: 10
    },
    academicYearId: { 
      type: Types.ObjectId, 
      ref: 'AcademicYear',
      required: true 
    },
    description: {
      type: String,
      trim: true
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    createdBy: {
      type: Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

// Compound unique index: courseCode should be unique per academic year
CourseSchema.index({ courseCode: 1, academicYearId: 1 }, { unique: true });

// Index for faster queries
CourseSchema.index({ academicYearId: 1, isActive: 1 });
CourseSchema.index({ courseName: 'text', description: 'text' });

export const Course = model('Course', CourseSchema);
