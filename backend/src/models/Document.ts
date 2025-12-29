import mongoose, { Schema, Document as MongooseDoc } from 'mongoose';

export interface IDocument extends MongooseDoc {
  userId: mongoose.Types.ObjectId;
  userRole: 'student' | 'teacher' | 'superadmin';
  category: string;
  documentType: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  gridfsFileId: string;
  description?: string;
  uploadedAt: Date;
}

const documentSchema = new Schema<IDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  userRole: { type: String, enum: ['student', 'teacher', 'superadmin'], required: true },
  category: { 
    type: String, 
    required: true,
    enum: [
      // Student categories
      'class10', 'class12', 'graduation', 'post_graduation',
      // Common categories
      'id_proof', 'certificate', 'experience', 'qualification', 'other'
    ]
  },
  documentType: { 
    type: String, 
    required: true,
    enum: ['marksheet', 'admit_card', 'migration', 'passing_certificate', 'degree', 
           'id_card', 'aadhar', 'pan', 'passport', 'driving_license',
           'experience_letter', 'offer_letter', 'relieving_letter',
           'diploma', 'certificate', 'other']
  },
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  gridfsFileId: { type: String, required: true },
  description: { type: String },
  uploadedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Index for faster queries
documentSchema.index({ userId: 1, category: 1 });
documentSchema.index({ gridfsFileId: 1 });

export const UserDocument = mongoose.model<IDocument>('Document', documentSchema);
