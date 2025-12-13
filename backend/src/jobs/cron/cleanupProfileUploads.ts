import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { UserProfile } from '../../models/UserProfile.ts';
import {
  PROFILE_IMAGE_UPLOAD_DIR,
  PROFILE_IMAGE_DEFAULT_STORAGE_PATH,
  PUBLIC_IMAGES_BASE_URL
} from '../../constants/media.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_RETENTION_DAYS = 30;
const DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h

export type CleanupResult = {
  deleted: number;
  kept: number;
  total: number;
  cutoff: string;
};

const uploadsDir = path.resolve(__dirname, '../../public', PROFILE_IMAGE_UPLOAD_DIR);

/**
 * Remove profile upload files that are no longer referenced by any profile or older than retention.
 */
export const cleanupOrphanedProfileUploads = async (
  retentionDays = DEFAULT_RETENTION_DAYS
): Promise<CleanupResult> => {
  await fs.promises.mkdir(uploadsDir, { recursive: true });

  const files = await fs.promises.readdir(uploadsDir);
  if (files.length === 0) {
    return { deleted: 0, kept: 0, total: 0, cutoff: new Date().toISOString() };
  }

  const cutoffMs = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const cutoffIso = new Date(cutoffMs).toISOString();

  // Collect active storage paths in DB (ignore defaults)
  const profiles = await UserProfile.find({ 'profilePicture.storagePath': { $exists: true } })
    .select('profilePicture.storagePath')
    .lean();

  const activePaths = new Set(
    profiles
      .map((p: any) => p.profilePicture?.storagePath as string | undefined)
      .filter((p): p is string => Boolean(p) && p !== PROFILE_IMAGE_DEFAULT_STORAGE_PATH)
  );

  let deleted = 0;
  let kept = 0;

  for (const file of files) {
    const storagePath = path.posix.join(PROFILE_IMAGE_UPLOAD_DIR, file);
    const filePath = path.join(uploadsDir, file);

    const stat = await fs.promises.stat(filePath).catch(() => null);
    if (!stat) continue;

    const isActive = activePaths.has(storagePath);
    const isOld = stat.mtimeMs < cutoffMs && stat.ctimeMs < cutoffMs;

    if (!isActive || isOld) {
      await fs.promises.unlink(filePath).catch(() => undefined);
      deleted += 1;
    } else {
      kept += 1;
    }
  }

  return { deleted, kept, total: files.length, cutoff: cutoffIso };
};

/**
 * Start periodic cleanup; no-op during tests. Returns the interval id so it can be cleared by callers if needed.
 */
type CleanupOptions = {
  intervalMs?: number;
  retentionDays?: number;
  logger?: Pick<Console, 'info' | 'error'>;
};

export const startProfileUploadCleanupJob = (options: CleanupOptions = {}): NodeJS.Timeout | null => {
  if (process.env.NODE_ENV === 'test') return null;

  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const retentionDays = options.retentionDays ?? DEFAULT_RETENTION_DAYS;
  const logger = options.logger ?? console;

  const runOnce = async () => {
    try {
      const result = await cleanupOrphanedProfileUploads(retentionDays);
      logger.info?.({ msg: 'profile-upload-cleanup', ...result, retentionDays });
    } catch (error) {
      logger.error?.({ msg: 'profile-upload-cleanup-error', error: (error as Error).message });
    }
  };

  // Run once on start (fire and forget)
  runOnce();

  return setInterval(runOnce, intervalMs);
};

/**
 * Helper to get the public URL for an uploaded file (useful for logging/debugging).
 */
export const toPublicUrl = (storagePath: string): string => {
  return `${PUBLIC_IMAGES_BASE_URL}/${storagePath.replace(/^images\//, '')}`;
};
