import { Schema, model, Types } from 'mongoose';

/**
 * ActivityLog Model - Tracks all system operations for admin transparency
 * Every important action in the system is logged here for audit purposes
 */
const ActivityLogSchema = new Schema(
  {
    // Who performed the action
    actor: { type: Types.ObjectId, refPath: 'actorModel', required: true },
    actorModel: { type: String, enum: ['SuperAdmin', 'Teacher', 'Student'], required: true },
    actorName: { type: String, required: true }, // Denormalized for quick display
    actorEmail: { type: String },
    
    // What action was performed
    action: { 
      type: String, 
      enum: [
        // Attendance actions
        'CREATE_ATTENDANCE', 'UPDATE_ATTENDANCE', 'BULK_CREATE_ATTENDANCE',
        // Fee actions
        'CREATE_FEE', 'UPDATE_FEE', 'RECORD_PAYMENT', 'DELETE_FEE',
        // Marks actions
        'CREATE_MARKS', 'UPDATE_MARKS', 'BULK_CREATE_MARKS', 'DELETE_MARKS',
        // Assignment actions
        'CREATE_ASSIGNMENT', 'UPDATE_ASSIGNMENT', 'DELETE_ASSIGNMENT', 
        'SUBMIT_ASSIGNMENT', 'GRADE_SUBMISSION',
        // User management actions
        'CREATE_STUDENT', 'UPDATE_STUDENT', 'DELETE_STUDENT',
        'CREATE_TEACHER', 'UPDATE_TEACHER', 'DELETE_TEACHER',
        'CREATE_ADMIN', 'UPDATE_ADMIN', 'DELETE_ADMIN',
        // System actions
        'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'PROFILE_UPDATE',
        // Other
        'OTHER'
      ],
      required: true 
    },
    
    // What was affected
    targetModel: { 
      type: String, 
      enum: ['Attendance', 'Fee', 'Mark', 'Assignment', 'AssignmentSubmission', 
             'Student', 'Teacher', 'SuperAdmin', 'Course', 'Subject', 'Class', 'Other'],
      required: true 
    },
    targetId: { type: Types.ObjectId },
    targetDescription: { type: String }, // e.g., "John Doe's attendance for Math"
    
    // Additional details
    details: { type: Schema.Types.Mixed }, // Flexible object for additional context
    previousValue: { type: Schema.Types.Mixed }, // For update operations
    newValue: { type: Schema.Types.Mixed }, // For update operations
    
    // Request metadata
    ipAddress: { type: String },
    userAgent: { type: String },
    
    // Status
    status: { type: String, enum: ['success', 'failed', 'pending'], default: 'success' },
    errorMessage: { type: String }
  },
  { 
    timestamps: true,
    // Optimize for time-based queries
    timeseries: undefined
  }
);

// Indexes for efficient querying
ActivityLogSchema.index({ createdAt: -1 }); // Recent activity first
ActivityLogSchema.index({ actor: 1, createdAt: -1 }); // Activity by user
ActivityLogSchema.index({ action: 1, createdAt: -1 }); // Activity by action type
ActivityLogSchema.index({ targetModel: 1, targetId: 1 }); // Activity on specific entity
ActivityLogSchema.index({ actorModel: 1, createdAt: -1 }); // Activity by role

export const ActivityLog = model('ActivityLog', ActivityLogSchema);
