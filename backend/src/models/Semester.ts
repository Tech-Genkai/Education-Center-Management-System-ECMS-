import { Schema, model, Types } from 'mongoose';

const SubjectTeacherAssignmentSchema = new Schema({
  subjectId: { 
    type: Types.ObjectId, 
    ref: 'Subject',
    required: true 
  },
  teacherId: { 
    type: Types.ObjectId, 
    ref: 'Teacher'
  },
  assignedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const SemesterSchema = new Schema(
  {
    semesterNumber: { 
      type: Number, 
      required: true,
      min: 1
    },
    courseId: { 
      type: Types.ObjectId, 
      ref: 'Course',
      required: true 
    },
    subjects: [SubjectTeacherAssignmentSchema],
    isActive: { 
      type: Boolean, 
      default: true 
    },
    startDate: Date,
    endDate: Date
  },
  { timestamps: true }
);

// Ensure semester number is unique within a course
SemesterSchema.index({ courseId: 1, semesterNumber: 1 }, { unique: true });

// Index for faster queries
SemesterSchema.index({ courseId: 1, isActive: 1 });

export const Semester = model('Semester', SemesterSchema);
