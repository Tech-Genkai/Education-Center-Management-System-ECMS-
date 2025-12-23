import mongoose from 'mongoose';
import { Readable } from 'stream';

let gfs: mongoose.mongo.GridFSBucket;

/**
 * Initialize GridFS bucket
 */
export const initGridFS = (conn: mongoose.Connection): mongoose.mongo.GridFSBucket => {
  if (!gfs) {
    if (!conn.db) {
      throw new Error('MongoDB connection database is undefined');
    }
    gfs = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: 'profilePictures'
    });
    console.log('✅ GridFS initialized with bucket: profilePictures');
  }
  return gfs;
};

/**
 * Get GridFS bucket instance
 */
export const getGridFS = (): mongoose.mongo.GridFSBucket => {
  if (!gfs) {
    throw new Error('GridFS not initialized. Call initGridFS first.');
  }
  return gfs;
};

/**
 * Upload file buffer to GridFS
 */
export const uploadToGridFS = (
  buffer: Buffer,
  filename: string,
  contentType: string,
  metadata?: Record<string, any>
): Promise<mongoose.mongo.GridFSFile> => {
  return new Promise((resolve, reject) => {
    const bucket = getGridFS();
    const readStream = Readable.from(buffer);
    const uploadStream = bucket.openUploadStream(filename, {
      contentType,
      metadata: {
        ...metadata,
        uploadedAt: new Date()
      }
    });

    readStream.pipe(uploadStream)
      .on('error', reject)
      .on('finish', () => {
        resolve({
          _id: uploadStream.id,
          length: buffer.length,
          chunkSize: uploadStream.chunkSizeBytes,
          uploadDate: new Date(),
          filename: filename,
          contentType: contentType
        } as mongoose.mongo.GridFSFile);
      });
  });
};

/**
 * Download file from GridFS by ID
 */
export const downloadFromGridFS = (fileId: string | mongoose.Types.ObjectId): NodeJS.ReadableStream => {
  const bucket = getGridFS();
  const objectId = typeof fileId === 'string' ? new mongoose.Types.ObjectId(fileId) : fileId;
  return bucket.openDownloadStream(objectId);
};

/**
 * Delete file from GridFS by ID (deletes both file metadata and all chunks)
 */
export const deleteFromGridFS = async (fileId: string | mongoose.Types.ObjectId): Promise<void> => {
  const bucket = getGridFS();
  const objectId = typeof fileId === 'string' ? new mongoose.Types.ObjectId(fileId) : fileId;
  
  // Verify file exists before attempting deletion
  const file = await findGridFSFile(objectId);
  if (!file) {
    console.warn(`⚠️ GridFS file ${objectId} not found, skipping deletion`);
    return;
  }
  
  try {
    // bucket.delete() automatically deletes both the file metadata and all associated chunks
    await bucket.delete(objectId);
    console.log(`✅ Deleted GridFS file and chunks: ${objectId}`);
  } catch (error: any) {
    console.error(`❌ Failed to delete GridFS file ${objectId}:`, error);
    throw error;
  }
};

/**
 * Find file metadata in GridFS
 */
export const findGridFSFile = async (fileId: string | mongoose.Types.ObjectId): Promise<mongoose.mongo.GridFSFile | null> => {
  const bucket = getGridFS();
  const objectId = typeof fileId === 'string' ? new mongoose.Types.ObjectId(fileId) : fileId;
  const files = await bucket.find({ _id: objectId }).toArray();
  return files.length > 0 ? files[0] : null;
};

/**
 * Find files by filename in GridFS
 */
export const findGridFSFileByName = async (filename: string): Promise<mongoose.mongo.GridFSFile | null> => {
  const bucket = getGridFS();
  const files = await bucket.find({ filename }).toArray();
  return files.length > 0 ? files[0] : null;
};
