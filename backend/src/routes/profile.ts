import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Types } from 'mongoose';
import { UserProfile } from '../models/UserProfile.ts';
import { authMiddleware } from '../middleware/auth.ts';
import {
  PROFILE_IMAGE_DEFAULT_STORAGE_PATH,
  PROFILE_IMAGE_DEFAULT_URL,
  PROFILE_IMAGE_UPLOAD_DIR
} from '../constants/media.ts';
import sizeOf from 'image-size';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.resolve(__dirname, `../../public/${PROFILE_IMAGE_UPLOAD_DIR}`);
fs.mkdirSync(uploadDir, { recursive: true });

const BASE_LIMITS = {
  maxBytes: 2 * 1024 * 1024, // 2MB
  maxWidth: 1024,
  maxHeight: 1024,
  minWidth: 128,
  minHeight: 128
};

const PRIVILEGED_LIMITS = {
  maxBytes: 4 * 1024 * 1024, // 4MB
  maxWidth: 2048,
  maxHeight: 2048,
  minWidth: 128,
  minHeight: 128
};

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const getImageLimitsForRole = (role?: string) => {
  if (role === 'admin' || role === 'teacher') return PRIVILEGED_LIMITS;
  return BASE_LIMITS;
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: PRIVILEGED_LIMITS.maxBytes },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new Error('Only JPEG, PNG, or WEBP images are allowed'));
      return;
    }
    cb(null, true);
  }
});

const uploadResponseSchema = z.object({
  message: z.string(),
  url: z.string(),
  storagePath: z.string(),
  profile: z.any()
});

const errorResponseSchema = z.object({
  message: z.string(),
  allowedTypes: z.array(z.string()).optional(),
  maxBytes: z.number().optional(),
  error: z.string().optional()
});

router.post('/avatar', authMiddleware, upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.body as { userId?: string };
    const requester = (req as any).auth as { userId?: string; role?: string };

    if (!userId || !Types.ObjectId.isValid(userId)) {
      if (req.file?.path) fs.unlink(req.file.path, () => undefined);
      return res.status(400).json({ message: 'userId is required and must be a valid ObjectId' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    // Authorization: admin can upload for anyone; users only for themselves
    if (requester?.role !== 'admin' && requester?.userId !== userId) {
      if (req.file?.path) fs.unlink(req.file.path, () => undefined);
      return res.status(403).json({ message: 'Forbidden' });
    }

    const limits = getImageLimitsForRole(requester?.role);

    // Additional server-side validation for type/size to keep response schema explicit
    if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
      fs.unlink(req.file.path, () => undefined);
      return res.status(400).json({
        message: 'Invalid file type',
        allowedTypes: ALLOWED_MIME_TYPES
      });
    }

    if (req.file.size > limits.maxBytes) {
      fs.unlink(req.file.path, () => undefined);
      return res.status(400).json({
        message: 'File too large',
        maxBytes: limits.maxBytes,
        role: requester?.role || 'user'
      });
    }

    const dimensions = sizeOf(req.file.path);
    if (
      !dimensions?.width ||
      !dimensions?.height ||
      dimensions.width > limits.maxWidth ||
      dimensions.height > limits.maxHeight ||
      dimensions.width < limits.minWidth ||
      dimensions.height < limits.minHeight
    ) {
      fs.unlink(req.file.path, () => undefined);
      return res.status(400).json({
        message: 'Image dimensions out of allowed range',
        maxWidth: limits.maxWidth,
        maxHeight: limits.maxHeight,
        minWidth: limits.minWidth,
        minHeight: limits.minHeight,
        role: requester?.role || 'user'
      });
    }

    const relativeStoragePath = path.posix.join(PROFILE_IMAGE_UPLOAD_DIR, req.file.filename);
    const publicUrl = `/static/${relativeStoragePath}`;

    // Find current profile to delete old uploaded image if replacing
    const existing = await UserProfile.findOne({ userId });

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          avatarUrl: publicUrl,
          profilePicture: {
            url: publicUrl,
            storagePath: relativeStoragePath,
            isDefault: false,
            uploadedAt: new Date()
          }
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Cleanup old uploaded image (only if it was not default and path exists)
    if (existing?.profilePicture?.storagePath && existing.profilePicture.isDefault === false) {
      const oldPath = path.resolve(__dirname, '../../public', existing.profilePicture.storagePath);
      if (fs.existsSync(oldPath)) {
        fs.unlink(oldPath, () => undefined);
      }
    }

    const responsePayload = {
      message: 'Profile image uploaded successfully',
      url: publicUrl,
      storagePath: relativeStoragePath,
      profile
    };

    const parsed = uploadResponseSchema.safeParse(responsePayload);
    if (!parsed.success) {
      return res.status(500).json({ message: 'Response validation failed', error: parsed.error.message });
    }

    return res.status(200).json(parsed.data);
  } catch (error) {
    if (req.file?.path) fs.unlink(req.file.path, () => undefined);
    const errPayload = { message: 'Failed to upload image', error: (error as Error).message };
    const parsed = errorResponseSchema.safeParse(errPayload);
    return res.status(500).json(parsed.success ? parsed.data : errPayload);
  }
});

// Delete avatar (revert to default)
router.delete('/avatar', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body as { userId?: string };
    const requester = (req as any).auth as { userId?: string; role?: string };

    if (!userId || !Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'userId is required and must be a valid ObjectId' });
    }

    if (requester?.role !== 'admin' && requester?.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const existing = await UserProfile.findOne({ userId });
    if (!existing) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const currentPath = existing.profilePicture?.storagePath;
    if (currentPath && currentPath !== PROFILE_IMAGE_DEFAULT_STORAGE_PATH) {
      const absPath = path.resolve(__dirname, '../../public', currentPath);
      if (fs.existsSync(absPath)) {
        fs.unlink(absPath, () => undefined);
      }
    }

    const defaults = {
      avatarUrl: PROFILE_IMAGE_DEFAULT_URL,
      profilePicture: {
        url: PROFILE_IMAGE_DEFAULT_URL,
        storagePath: PROFILE_IMAGE_DEFAULT_STORAGE_PATH,
        isDefault: true,
        uploadedAt: undefined
      }
    };

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { $set: defaults },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ message: 'Avatar removed, reverted to default', profile });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete avatar', error: (error as Error).message });
  }
});

// Get profile by userId
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.query as { userId?: string };
    const requester = (req as any).auth as { userId?: string; role?: string };

    if (!userId || !Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'userId is required and must be a valid ObjectId' });
    }

    if (requester?.role !== 'admin' && requester?.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const profile = await UserProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    return res.status(200).json({ profile });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch profile', error: (error as Error).message });
  }
});

// Update profile (for session-based auth from dashboard)
router.put('/', async (req: Request, res: Response) => {
  try {
    // Get userId from session
    const session = (req as any).session;
    if (!session || !session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userId = session.userId;
    const { firstName, lastName, phone, dateOfBirth, gender, designation, department, address, bloodGroup, emergencyContact } = req.body;

    // Import SuperAdmin model
    const { SuperAdmin } = await import('../models/SuperAdmin.ts');
    
    // Update SuperAdmin profile
    const adminProfile = await SuperAdmin.findOne({ userId });
    if (adminProfile) {
      if (firstName) adminProfile.firstName = firstName;
      if (lastName) adminProfile.lastName = lastName;
      if (phone) adminProfile.phone = phone;
      if (dateOfBirth) adminProfile.dateOfBirth = new Date(dateOfBirth);
      if (gender) adminProfile.gender = gender;
      if (designation) adminProfile.designation = designation;
      if (department) adminProfile.department = department;
      await adminProfile.save();
    }

    // Update UserProfile
    const profileData: any = {};
    if (firstName || lastName) {
      profileData.displayName = `${firstName || ''} ${lastName || ''}`.trim();
    }
    if (phone) profileData.phone = phone;
    if (dateOfBirth) profileData.dateOfBirth = new Date(dateOfBirth);
    if (gender) profileData.gender = gender;

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { $set: profileData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ 
      message: 'Profile updated successfully',
      profile 
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ message: 'Failed to update profile', error: (error as Error).message });
  }
});

// Upload profile picture (session-based)
router.post('/picture', upload.single('profileImage'), async (req: Request, res: Response) => {
  try {
    const session = (req as any).session;
    if (!session || !session.userId) {
      if (req.file?.path) fs.unlink(req.file.path, () => undefined);
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    const userId = session.userId;
    const limits = getImageLimitsForRole(session.role);

    // Validate dimensions
    const dimensions = sizeOf(req.file.path);
    if (!dimensions.width || !dimensions.height) {
      fs.unlink(req.file.path, () => undefined);
      return res.status(400).json({ message: 'Could not read image dimensions' });
    }

    if (dimensions.width < limits.minWidth || dimensions.height < limits.minHeight) {
      fs.unlink(req.file.path, () => undefined);
      return res.status(400).json({ 
        message: `Image too small. Minimum ${limits.minWidth}x${limits.minHeight}px` 
      });
    }

    if (dimensions.width > limits.maxWidth || dimensions.height > limits.maxHeight) {
      fs.unlink(req.file.path, () => undefined);
      return res.status(400).json({ 
        message: `Image too large. Maximum ${limits.maxWidth}x${limits.maxHeight}px` 
      });
    }

    const storagePath = `${PROFILE_IMAGE_UPLOAD_DIR}/${req.file.filename}`;
    const url = `/static/${storagePath}`;

    // Delete old profile picture if exists
    const existing = await UserProfile.findOne({ userId });
    if (existing) {
      const currentPath = existing.profilePicture?.storagePath;
      if (currentPath && currentPath !== PROFILE_IMAGE_DEFAULT_STORAGE_PATH) {
        const absPath = path.resolve(__dirname, '../../public', currentPath);
        if (fs.existsSync(absPath)) {
          fs.unlink(absPath, () => undefined);
        }
      }
    }

    // Update profile with new picture
    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          avatarUrl: url,
          'profilePicture.url': url,
          'profilePicture.storagePath': storagePath,
          'profilePicture.isDefault': false,
          'profilePicture.uploadedAt': new Date()
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      message: 'Profile picture uploaded successfully',
      url,
      storagePath,
      profile
    });
  } catch (error) {
    if (req.file?.path) fs.unlink(req.file.path, () => undefined);
    console.error('Upload error:', error);
    return res.status(500).json({ message: 'Failed to upload profile picture', error: (error as Error).message });
  }
});

// Multer error handler
router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  return res.status(500).json({ message: 'Unknown upload error' });
});

export default router;

