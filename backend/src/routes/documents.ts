import express from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import { Types } from 'mongoose';
import { requireAuth } from '../middleware/session.ts';
import { UserDocument } from '../models/Document.ts';
import { uploadToGridFS, downloadFromGridFS, deleteFromGridFS, findGridFSFile } from '../utils/gridfs.ts';

const router = express.Router();

// Multer config for memory storage (will upload to GridFS)
const storage = multer.memoryStorage();
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg', 
  'image/png', 
  'image/webp'
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new Error('Only PDF, JPEG, PNG, and WEBP files are allowed'));
      return;
    }
    cb(null, true);
  }
});

// Category labels for display
const CATEGORY_LABELS: Record<string, string> = {
  class10: 'Class 10 (Matriculation)',
  class12: 'Class 12 (Intermediate)',
  graduation: 'Graduation',
  post_graduation: 'Post Graduation',
  id_proof: 'ID Proof',
  certificate: 'Certificates',
  experience: 'Experience',
  qualification: 'Qualifications',
  other: 'Other Documents'
};

// Document type labels
const DOCTYPE_LABELS: Record<string, string> = {
  marksheet: 'Marksheet',
  admit_card: 'Admit Card',
  migration: 'Migration Certificate',
  passing_certificate: 'Passing Certificate',
  degree: 'Degree',
  id_card: 'ID Card',
  aadhar: 'Aadhar Card',
  pan: 'PAN Card',
  passport: 'Passport',
  driving_license: 'Driving License',
  experience_letter: 'Experience Letter',
  offer_letter: 'Offer Letter',
  relieving_letter: 'Relieving Letter',
  diploma: 'Diploma',
  certificate: 'Certificate',
  other: 'Other'
};

// Upload document
router.post('/upload', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const userRole = req.session.role as 'student' | 'teacher' | 'superadmin';
    const { category, documentType, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }

    if (!category || !documentType) {
      return res.status(400).json({ message: 'Category and document type are required' });
    }

    // Upload to GridFS
    const gridfsFile = await uploadToGridFS(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      { userId, category, documentType, uploadedAt: new Date() }
    );

    // Create document record
    const doc = new UserDocument({
      userId,
      userRole,
      category,
      documentType,
      fileName: req.file.originalname,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      gridfsFileId: gridfsFile._id.toString(),
      description
    });
    await doc.save();

    console.log('📄 Document uploaded:', doc.fileName, 'for user:', userId);

    return res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        id: doc._id,
        fileName: doc.fileName,
        category: doc.category,
        categoryLabel: CATEGORY_LABELS[doc.category] || doc.category,
        documentType: doc.documentType,
        documentTypeLabel: DOCTYPE_LABELS[doc.documentType] || doc.documentType,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        uploadedAt: doc.uploadedAt
      }
    });
  } catch (error: any) {
    console.error('❌ Document upload error:', error);
    return res.status(500).json({ message: 'Failed to upload document', error: error.message });
  }
});

// Get user's documents
router.get('/my', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const { category } = req.query;

    const query: any = { userId };
    if (category) query.category = category;

    const documents = await UserDocument.find(query).sort({ uploadedAt: -1 });

    // Group by category
    const grouped: Record<string, any[]> = {};
    documents.forEach(doc => {
      const cat = doc.category;
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push({
        id: doc._id,
        fileName: doc.fileName,
        documentType: doc.documentType,
        documentTypeLabel: DOCTYPE_LABELS[doc.documentType] || doc.documentType,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        description: doc.description,
        uploadedAt: doc.uploadedAt,
        viewUrl: `/api/documents/${doc._id}/view`,
        downloadUrl: `/api/documents/${doc._id}/download`
      });
    });

    // Format response with labels
    const result = Object.entries(grouped).map(([cat, docs]) => ({
      category: cat,
      categoryLabel: CATEGORY_LABELS[cat] || cat,
      documents: docs
    }));

    return res.status(200).json({ categories: result, total: documents.length });
  } catch (error: any) {
    console.error('❌ Error fetching documents:', error);
    return res.status(500).json({ message: 'Failed to fetch documents', error: error.message });
  }
});

// View/download document
router.get('/:id/view', requireAuth, async (req: Request, res: Response) => {
  try {
    const doc = await UserDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check authorization
    const isSuperAdmin = req.session.role === 'superadmin';
    if (!isSuperAdmin && doc.userId.toString() !== req.session.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const file = await findGridFSFile(doc.gridfsFileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found in storage' });
    }

    res.set({
      'Content-Type': doc.mimeType,
      'Content-Disposition': `inline; filename="${doc.originalName}"`,
      'Cache-Control': 'private, max-age=3600'
    });

    const downloadStream = await downloadFromGridFS(doc.gridfsFileId);
    downloadStream.pipe(res);
  } catch (error: any) {
    console.error('❌ Error viewing document:', error);
    return res.status(500).json({ message: 'Failed to view document', error: error.message });
  }
});

// Download document
router.get('/:id/download', requireAuth, async (req: Request, res: Response) => {
  try {
    const doc = await UserDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check authorization
    const isSuperAdmin = req.session.role === 'superadmin';
    if (!isSuperAdmin && doc.userId.toString() !== req.session.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const file = await findGridFSFile(doc.gridfsFileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found in storage' });
    }

    res.set({
      'Content-Type': doc.mimeType,
      'Content-Disposition': `attachment; filename="${doc.originalName}"`
    });

    const downloadStream = await downloadFromGridFS(doc.gridfsFileId);
    downloadStream.pipe(res);
  } catch (error: any) {
    console.error('❌ Error downloading document:', error);
    return res.status(500).json({ message: 'Failed to download document', error: error.message });
  }
});

// Delete document
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const doc = await UserDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check authorization
    const isSuperAdmin = req.session.role === 'superadmin';
    if (!isSuperAdmin && doc.userId.toString() !== req.session.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Delete from GridFS
    try {
      await deleteFromGridFS(doc.gridfsFileId);
    } catch (err) {
      console.warn('⚠️ Failed to delete from GridFS:', err);
    }

    // Delete document record
    await UserDocument.findByIdAndDelete(req.params.id);

    console.log('🗑️ Document deleted:', doc.fileName);

    return res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('❌ Error deleting document:', error);
    return res.status(500).json({ message: 'Failed to delete document', error: error.message });
  }
});

// Get categories for user role
router.get('/categories', requireAuth, async (req: Request, res: Response) => {
  const role = req.session.role;
  
  let categories: { value: string; label: string }[] = [];
  
  if (role === 'student') {
    categories = [
      { value: 'class10', label: 'Class 10 (Matriculation)' },
      { value: 'class12', label: 'Class 12 (Intermediate)' },
      { value: 'graduation', label: 'Graduation' },
      { value: 'post_graduation', label: 'Post Graduation' },
      { value: 'id_proof', label: 'ID Proof' },
      { value: 'certificate', label: 'Certificates' },
      { value: 'other', label: 'Other' }
    ];
  } else if (role === 'teacher') {
    categories = [
      { value: 'qualification', label: 'Qualifications' },
      { value: 'experience', label: 'Experience' },
      { value: 'id_proof', label: 'ID Proof' },
      { value: 'certificate', label: 'Certificates' },
      { value: 'other', label: 'Other' }
    ];
  } else {
    categories = [
      { value: 'id_proof', label: 'ID Proof' },
      { value: 'certificate', label: 'Certificates' },
      { value: 'other', label: 'Other' }
    ];
  }

  return res.status(200).json({ categories });
});

// Get document types
router.get('/types', requireAuth, async (_req: Request, res: Response) => {
  const types = Object.entries(DOCTYPE_LABELS).map(([value, label]) => ({ value, label }));
  return res.status(200).json({ types });
});

export default router;
