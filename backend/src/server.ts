import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { json, urlencoded } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import profileRouter from './routes/profile.ts';
import superAdminRouter from './routes/superAdmin.ts';
import { startProfileUploadCleanupJob } from './jobs/cron/cleanupProfileUploads.ts';
import swaggerUi from 'swagger-ui-express';
import openapiSpec from './docs/openapi.ts';
import authRouter from './routes/auth.ts';
import authSSR from './routes/authSSR.ts';
import viewRoutes from './routes/views.ts';
import { attachUserToLocals } from './middleware/session.ts';
import { connectDatabase, getDatabaseStatus, pingDatabase } from './config/database.ts';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure view engine for SSR
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

app.use(helmet({
  contentSecurityPolicy: false // Disable for EJS templates
}));
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

// Serve frontend assets (CSS, JS)
const frontendAssetsPath = path.resolve(__dirname, '../../frontend/assets');
app.use('/assets', express.static(frontendAssetsPath));

// Attach session user to locals for all templates
app.use(attachUserToLocals);

// SSR routes (must come before API routes)
app.use('/', authSSR);
app.use('/', viewRoutes);

// API docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.get('/docs.json', (_req, res) => res.json(openapiSpec));

// API routes (keep for backward compatibility)
app.use('/api/profile', profileRouter);
app.use('/api/superadmins', superAdminRouter);

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

// 404 handler - must be after all routes
app.use((req, res, next) => {
  res.status(404).render('errors/404', {
    title: 'Page Not Found',
    url: req.url
  });
});

// Error handler - must be last
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err);
  const status = err.status || err.statusCode || 500;
  const title = err.title || (status === 500 ? 'Internal Server Error' : 'Error');
  const message = err.message || 'Something went wrong';

  // Check if it's an API request
  if (req.path.startsWith('/api/')) {
    return res.status(status).json({
      error: message,
      status,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Render appropriate error page
  if (status === 404) {
    res.status(404).render('errors/404', { title, url: req.url });
  } else if (status === 401) {
    res.status(401).render('errors/401', { title, message });
  } else if (status === 403) {
    res.status(403).render('errors/403', { title, message });
  } else if (status === 500 || status >= 500) {
    res.status(status).render('errors/500', { 
      title, 
      message, 
      error: process.env.NODE_ENV === 'development' ? err : null 
    });
  } else {
    res.status(status).render('errors/error', {
      status,
      title,
      message,
      error: process.env.NODE_ENV === 'development' ? err : null
    });
  }
});

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
