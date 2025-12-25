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
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'active'
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    createdBy: {
      type: Types.ObjectId,
      ref: 'User'
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound unique index: courseCode should be unique per academic year
CourseSchema.index({ courseCode: 1, academicYearId: 1 }, { unique: true });

// Index for faster queries
CourseSchema.index({ academicYearId: 1, status: 1 });
CourseSchema.index({ academicYearId: 1, isActive: 1 });
CourseSchema.index({ courseName: 'text', description: 'text' });

// Virtual for student count (will be populated by aggregation)
CourseSchema.virtual('studentCount').get(function() {
  return this._studentCount || 0;
});

export const Course = model('Course', CourseSchema);
