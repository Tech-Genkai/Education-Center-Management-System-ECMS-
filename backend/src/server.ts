import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import mongoose from 'mongoose';

const app = express();

// Database connection
let isConnected = false;

const connectDatabase = async (): Promise<void> => {
  if (isConnected) return;

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/scms';

  try {
    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

const getDatabaseStatus = (): { connected: boolean; message: string } => {
  const state = mongoose.connection.readyState;
  switch (state) {
    case 0: return { connected: false, message: 'disconnected' };
    case 1: return { connected: true, message: 'connected' };
    case 2: return { connected: false, message: 'connecting' };
    case 3: return { connected: false, message: 'disconnecting' };
    default: return { connected: false, message: 'unknown' };
  }
};

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(json({ limit: '1mb' }));
app.use(urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get('/healthz', (_req, res) => {
  const dbStatus = getDatabaseStatus();
  res.status(200).json({ 
    status: 'ok', 
    service: 'backend', 
    database: dbStatus,
    ts: new Date().toISOString() 
  });
});

const port = process.env.PORT || 5000;

// Only start the server when executed directly (not during tests)
if (process.env.NODE_ENV !== 'test') {
  // Connect to database
  connectDatabase();
  
  app.listen(port, () => {
    // Basic startup log; replace with structured logger later
    console.log(`API listening on port ${port}`);
  });
}

export { app };
