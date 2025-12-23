import mongoose from 'mongoose';
import { initGridFS } from '../utils/gridfs.ts';

let isConnecting = false;

function resolveMongoUri(uri?: string) {
  const envUri = process.env.MONGODB_URI || process.env.MONGODB_URL || '';
  const chosen = (uri && uri.trim()) || envUri.trim();
  if (!chosen) {
    throw new Error('MONGODB_URI (or MONGODB_URL) is required and no local fallback is allowed.');
  }
  return chosen;
}

export async function connectDatabase(uri?: string, appName = 'ecms-api') {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (isConnecting) return mongoose.connection;

  const mongoUri = resolveMongoUri(uri);

  try {
    isConnecting = true;
    await mongoose.connect(mongoUri, {
      appName,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      heartbeatFrequencyMS: 8000
    });
    console.log('MongoDB connected');
    
    // Initialize GridFS after connection
    initGridFS(mongoose.connection);
    
    return mongoose.connection;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  } finally {
    isConnecting = false;
  }
}

export function getDatabaseStatus() {
  const state = mongoose.connection.readyState;
  const map = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  } as const;
  return { connected: state === 1, message: map[state as keyof typeof map] ?? 'unknown' };
}

export async function pingDatabase(timeoutMs = 2000) {
  if (mongoose.connection.readyState !== 1) return false;
  if (!mongoose.connection.db) return false;
  const ping = mongoose.connection.db.admin().ping().then(() => true).catch(() => false);
  const timeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs));
  return Promise.race([ping, timeout]);
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
