import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import profileRouter from './routes/profile.ts';
import { startProfileUploadCleanupJob } from './jobs/cron/cleanupProfileUploads.ts';
import swaggerUi from 'swagger-ui-express';
import openapiSpec from './docs/openapi.ts';
import authRouter from './routes/auth.ts';
import { connectDatabase, getDatabaseStatus, pingDatabase } from './config/database.ts';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Serve static assets (images, icons, etc.) with cache headers
const staticAssetsPath = path.resolve(__dirname, '../public');
app.use(
  '/static',
  express.static(staticAssetsPath, {
    setHeaders: (res, filePath) => {
      const isImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(filePath);
      // 30d for images (immutable), 1h for other assets in /static
      if (isImage) {
        res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    }
  })
);

// API docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.get('/docs.json', (_req, res) => res.json(openapiSpec));

// API routes
app.use('/api/profile', profileRouter);

app.get('/healthz', async (_req, res) => {
  const dbStatus = getDatabaseStatus();
  const ping = await pingDatabase();
  const isHealthy = dbStatus.connected && ping;
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    service: 'backend',
    database: { ...dbStatus, ping },
    ts: new Date().toISOString()
  });
});
  app.use('/api/auth', authRouter);

const port = process.env.PORT || 5000;

// Only start the server when executed directly (not during tests)
if (process.env.NODE_ENV !== 'test') {
  // Connect to database using required env URI (no local fallback)
  connectDatabase(process.env.MONGODB_URI || process.env.MONGODB_URL, 'ecms-api').catch((err) => {
    console.error('Database connection failed during startup:', err);
  });
  const retentionDaysEnv = Number(process.env.PROFILE_UPLOAD_RETENTION_DAYS);
  const intervalMsEnv = Number(process.env.PROFILE_UPLOAD_CLEANUP_INTERVAL_MS);
  startProfileUploadCleanupJob({
    retentionDays: Number.isFinite(retentionDaysEnv) ? retentionDaysEnv : undefined,
    intervalMs: Number.isFinite(intervalMsEnv) ? intervalMsEnv : undefined,
    logger: console
  });
  
  app.listen(port, () => {
    // Basic startup log; replace with structured logger later
    console.log(`API listening on port ${port}`);
  });
}

export { app };
