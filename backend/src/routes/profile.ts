import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import { Types } from 'mongoose';
import { requireAuth } from '../middleware/session.ts';
import { UserProfile } from '../models/UserProfile.ts';
import { SuperAdmin } from '../models/SuperAdmin.ts';
import { Teacher } from '../models/Teacher.ts';
import { Student } from '../models/Student.ts';
import { User } from '../models/User.ts';
import { Address } from '../models/Address.ts';
import { authMiddleware } from '../middleware/auth.ts';
import {
  PROFILE_IMAGE_DEFAULT_URL
} from '../constants/media.ts';
import sizeOf from 'image-size';
import { uploadToGridFS, downloadFromGridFS, deleteFromGridFS, findGridFSFile } from '../utils/gridfs.ts';

const router = express.Router();

// Hybrid auth middleware that supports both JWT and session
const hybridAuth = (req: Request, res: Response, next: NextFunction) => {
  // Check session first (for dashboard)
  if (req.session && req.session.userId) {
    (req as any).auth = {
      userId: req.session.userId,
      role: req.session.role
    };
    return next();
  }
  
  // Fall back to JWT auth (for API)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authMiddleware(req, res, next);
  }
  
  // No valid auth found
  return res.status(401).json({ message: 'Unauthorized' });
};

// Use memory storage for multer since we'll upload to GridFS
const storage = multer.memoryStorage();

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
  if (role === 'admin' || role === 'teacher' || role === 'superadmin') return PRIVILEGED_LIMITS;
  return BASE_LIMITS;
};

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
  fileId: z.string(),
  profile: z.any()
});

const errorResponseSchema = z.object({
  message: z.string(),
  allowedTypes: z.array(z.string()).optional(),
  maxBytes: z.number().optional(),
  error: z.string().optional()
});

router.post('/avatar', requireAuth, upload.single('image'), async (req: Request, res: Response) => {
  try {
    console.log('📸 Avatar upload request received');
    console.log('Body userId:', req.body.userId);
    console.log('Session:', { userId: req.session.userId, role: req.session.role });
    console.log('File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');
    
    const { userId } = req.body as { userId?: string };
    const requester = { userId: req.session.userId, role: req.session.role };

    if (!userId || !Types.ObjectId.isValid(userId)) {
      console.error('❌ Invalid userId:', userId);
      return res.status(400).json({ message: 'userId is required and must be a valid ObjectId' });
    }

    if (!req.file) {
      console.error('❌ No file uploaded');
      return res.status(400).json({ message: 'Image file is required' });
    }

    // Authorization: admin/superadmin can upload for anyone; users only for themselves
    const isSuperAdmin = requester?.role === 'superadmin' || requester?.role === 'admin';
    console.log('🔐 Authorization check:', { isSuperAdmin, requesterRole: requester?.role, requesterId: requester?.userId, targetUserId: userId });
    
    if (!isSuperAdmin && requester?.userId !== userId) {
      console.error('❌ Forbidden: User cannot upload for another user');
      return res.status(403).json({ message: 'Forbidden' });
    }

    const limits = getImageLimitsForRole(requester?.role);

    // Additional server-side validation for type/size to keep response schema explicit
    if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({
        message: 'Invalid file type',
        allowedTypes: ALLOWED_MIME_TYPES
      });
    }

    if (req.file.size > limits.maxBytes) {
      return res.status(400).json({
        message: 'File too large',
        maxBytes: limits.maxBytes,
        role: requester?.role || 'user'
      });
    }

    const dimensions = sizeOf(req.file.buffer);
    if (
      !dimensions?.width ||
      !dimensions?.height ||
      dimensions.width > limits.maxWidth ||
      dimensions.height > limits.maxHeight ||
      dimensions.width < limits.minWidth ||
      dimensions.height < limits.minHeight
    ) {
      return res.status(400).json({
        message: 'Image dimensions out of allowed range',
        maxWidth: limits.maxWidth,
        maxHeight: limits.maxHeight,
        minWidth: limits.minWidth,
        minHeight: limits.minHeight,
        role: requester?.role || 'user'
      });
    }

    // Find current profile to delete old uploaded image if replacing
    const existing = await UserProfile.findOne({ userId });

    // Delete old GridFS file if exists
    if (existing?.profilePicture?.gridfsFileId && existing.profilePicture.isDefault === false) {
      try {
        await deleteFromGridFS(existing.profilePicture.gridfsFileId);
        console.log('🗑️ Deleted old GridFS file:', existing.profilePicture.gridfsFileId);
      } catch (err) {
        console.warn('⚠️ Failed to delete old GridFS file:', err);
      }
    }

    // Upload to GridFS
    const gridfsFile = await uploadToGridFS(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      { userId, uploadedAt: new Date() }
    );
    const fileId = gridfsFile._id.toString();
    console.log('✅ Uploaded to GridFS with fileId:', fileId);

    const publicUrl = `/api/profile/avatar/${fileId}`;

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          avatarUrl: publicUrl,
          profilePicture: {
            url: publicUrl,
            gridfsFileId: fileId,
            isDefault: false,
            uploadedAt: new Date()
          }
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Also update the role-specific profile model (SuperAdmin, Teacher, Student)
    const user = await User.findById(userId);
    console.log('👤 User found:', user ? `${user.role}` : 'Not found');
    
    if (user) {
      // Update User model with profile picture for session access
      await User.findByIdAndUpdate(userId, { $set: { profilePicture: publicUrl } });
      console.log('✅ User profile picture updated for userId:', userId);
      console.log('   Profile picture URL:', publicUrl);
      
      if (user.role === 'superadmin') {
        const updated = await SuperAdmin.findOneAndUpdate(
          { userId },
          { $set: { profilePicture: publicUrl } },
          { new: true }
        );
        console.log('✅ SuperAdmin profile picture updated:', updated ? 'Success' : 'Failed');
        if (updated) {
          console.log('   SuperAdmin ID:', updated._id);
          console.log('   Admin ID:', updated.adminId);
          console.log('   Profile Picture:', updated.profilePicture);
        }
      } else if (user.role === 'teacher') {
        await Teacher.findOneAndUpdate(
          { userId },
          { $set: { profilePicture: publicUrl } },
          { new: true }
        );
        console.log('✅ Teacher profile picture updated');
      } else if (user.role === 'student') {
        await Student.findOneAndUpdate(
          { userId },
          { $set: { profilePicture: publicUrl } },
          { new: true }
        );
        console.log('✅ Student profile picture updated');
      }
    }

    const responsePayload = {
      message: 'Profile image uploaded successfully',
      url: publicUrl,
      fileId,
      profile
    };

    const parsed = uploadResponseSchema.safeParse(responsePayload);
    if (!parsed.success) {
      console.error('❌ Response validation failed:', parsed.error);
      return res.status(500).json({ message: 'Response validation failed', error: parsed.error.message });
    }

    console.log('✅ Avatar upload successful:', publicUrl);
    return res.status(200).json(parsed.data);
  } catch (error) {
    console.error('❌ Avatar upload error:', error);
    const errPayload = { message: 'Failed to upload image', error: (error as Error).message };
    const parsed = errorResponseSchema.safeParse(errPayload);
    return res.status(500).json(parsed.success ? parsed.data : errPayload);
  }
});

// Delete avatar (revert to default)
router.delete('/avatar', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body as { userId?: string };
    const requester = { userId: req.session.userId, role: req.session.role };

    if (!userId || !Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'userId is required and must be a valid ObjectId' });
    }

    const isSuperAdmin = requester?.role === 'superadmin' || requester?.role === 'admin';
    if (!isSuperAdmin && requester?.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const existing = await UserProfile.findOne({ userId });
    if (!existing) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Delete GridFS file if exists
    if (existing.profilePicture?.gridfsFileId && existing.profilePicture.isDefault === false) {
      try {
        await deleteFromGridFS(existing.profilePicture.gridfsFileId);
        console.log('🗑️ Deleted GridFS file:', existing.profilePicture.gridfsFileId);
      } catch (err) {
        console.warn('⚠️ Failed to delete GridFS file:', err);
      }
    }

    const defaults = {
      avatarUrl: PROFILE_IMAGE_DEFAULT_URL,
      profilePicture: {
        url: PROFILE_IMAGE_DEFAULT_URL,
        gridfsFileId: undefined,
        isDefault: true,
        uploadedAt: undefined
      }
    };

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { $set: defaults },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Also update the role-specific profile model
    const user = await User.findById(userId);
    if (user) {
      if (user.role === 'superadmin') {
        await SuperAdmin.findOneAndUpdate(
          { userId },
          { $set: { profilePicture: PROFILE_IMAGE_DEFAULT_URL } },
          { new: true }
        );
      } else if (user.role === 'teacher') {
        await Teacher.findOneAndUpdate(
          { userId },
          { $set: { profilePicture: PROFILE_IMAGE_DEFAULT_URL } },
          { new: true }
        );
      } else if (user.role === 'student') {
        await Student.findOneAndUpdate(
          { userId },
          { $set: { profilePicture: PROFILE_IMAGE_DEFAULT_URL } },
          { new: true }
        );
      }
    }

    return res.status(200).json({ message: 'Avatar removed, reverted to default', profile });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete avatar', error: (error as Error).message });
  }
});

// Get profile by userId
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.query as { userId?: string };
    const requester = { userId: req.session.userId, role: req.session.role };

    if (!userId || !Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'userId is required and must be a valid ObjectId' });
    }

    const isSuperAdmin = requester?.role === 'superadmin' || requester?.role === 'admin';
    if (!isSuperAdmin && requester?.userId !== userId) {
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
router.put('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const { firstName, lastName, phone, dateOfBirth, gender, designation, department, address, bloodGroup, emergencyContact, houseNo, buildingName, street, city, district, state, country, pinCode, landmark, zipCode } = req.body;

    // Update User account info
    const user = await User.findById(userId);
    if (user) {
      if (phone) user.phone = phone;
      await user.save();
    }
    
    const addressFields = {
      houseNo,
      buildingName,
      street,
      city,
      district,
      state,
      country,
      pinCode: pinCode || zipCode,
      landmark
    };
    const hasAddressInput = Object.values(addressFields).some((v) => (typeof v === 'string' ? v.trim() : v));

    // Update SuperAdmin profile
    const adminProfile = await SuperAdmin.findOne({ userId });
    if (adminProfile) {
      if (firstName) adminProfile.firstName = firstName;
      if (lastName) adminProfile.lastName = lastName;
      if (dateOfBirth) adminProfile.dateOfBirth = new Date(dateOfBirth);
      if (gender) adminProfile.gender = gender;
      if (designation) adminProfile.designation = designation;
      if (department) adminProfile.department = department;

      if (hasAddressInput) {
        let addr = adminProfile.addressId ? await Address.findById(adminProfile.addressId) : null;
        if (!addr) addr = new Address({ userId });
        Object.entries(addressFields).forEach(([key, value]) => {
          if (value !== undefined) (addr as any)[key] = (value as string)?.trim() || undefined;
        });
        await addr.save();
        adminProfile.addressId = addr._id;
      }

      await adminProfile.save();
    }

    // Update Student profile
    const studentProfile = await Student.findOne({ userId });
    if (studentProfile) {
      if (firstName) studentProfile.firstName = firstName;
      if (lastName) studentProfile.lastName = lastName;
      if (phone) studentProfile.phone = phone;
      if (dateOfBirth) studentProfile.dateOfBirth = new Date(dateOfBirth);
      if (gender) studentProfile.gender = gender;

      await studentProfile.save();
    }

    // Update UserProfile
    const profileData: any = {};
    if (firstName || lastName) {
      profileData.displayName = `${firstName || ''} ${lastName || ''}`.trim();
    }
    if (phone) profileData.phone = phone;
    if (dateOfBirth) profileData.dateOfBirth = new Date(dateOfBirth);
    if (gender) profileData.gender = gender;
    if (bloodGroup) profileData.bloodGroup = bloodGroup;

    let profile = await UserProfile.findOne({ userId });
    if (profile) {
      Object.assign(profile, profileData);
      if (hasAddressInput) {
        let addr = profile.addressId ? await Address.findById(profile.addressId) : null;
        if (!addr) addr = new Address({ userId });
        Object.entries(addressFields).forEach(([key, value]) => {
          if (value !== undefined) (addr as any)[key] = (value as string)?.trim() || undefined;
        });
        await addr.save();
        profile.addressId = addr._id;
      }
      await profile.save();
    } else {
      profile = new UserProfile({ userId, ...profileData });
      if (hasAddressInput) {
        const addr = new Address({ userId });
        Object.entries(addressFields).forEach(([key, value]) => {
          if (value !== undefined) (addr as any)[key] = (value as string)?.trim() || undefined;
        });
        await addr.save();
        profile.addressId = addr._id;
      }
      await profile.save();
    }

    return res.status(200).json({ 
      message: 'Profile updated successfully',
      profile,
      adminProfile,
      studentProfile
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ message: 'Failed to update profile', error: (error as Error).message });
  }
});

// Upload profile picture (session-based)
router.post('/picture', requireAuth, upload.single('profileImage'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    const userId = req.session.userId;
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

// Serve avatar image from GridFS
router.get('/avatar/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;

    if (!Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ message: 'Invalid file ID' });
    }

    const file = await findGridFSFile(fileId);
    if (!file) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Set cache headers
    res.set({
      'Content-Type': file.contentType || 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      'ETag': fileId
    });

    // Stream the file from GridFS
    const downloadStream = await downloadFromGridFS(fileId);
    downloadStream.pipe(res);
  } catch (error) {
    console.error('❌ Error serving avatar:', error);
    return res.status(500).json({ message: 'Failed to load image', error: (error as Error).message });
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

