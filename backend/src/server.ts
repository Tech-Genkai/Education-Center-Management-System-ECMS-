import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { json, urlencoded } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import profileRouter from './routes/profile.ts';
import superAdminRouter from './routes/superAdmin.ts';
import studentsRouter from './routes/students.ts';
import teachersRouter from './routes/teachers.ts';
import classesRouter from './routes/classes.ts';
import subjectsRouter from './routes/subjects.ts';
import academicYearsRouter from './routes/academicYears.ts';
import coursesRouter from './routes/courses.ts';
import semestersRouter from './routes/semesters.ts';
import { startProfileUploadCleanupJob } from './jobs/cron/cleanupProfileUploads.ts';
import swaggerUi from 'swagger-ui-express';
import openapiSpec from './docs/openapi.ts';
import authRouter from './routes/auth.ts';
import authSSR from './routes/authSSR.ts';
import viewRoutes from './routes/views.ts';
import { attachUserToLocals } from './middleware/session.ts';
import { connectDatabase, getDatabaseStatus, pingDatabase } from './config/database.ts';

// Connect to database at module load time (important for Vercel serverless)
// This ensures DB is connected before handling any requests
const dbConnectionPromise = connectDatabase(
  process.env.MONGODB_URI || process.env.MONGODB_URL, 
  'ecms-api'
).then(() => {
  console.log('✅ MongoDB connected successfully');
}).catch((err) => {
  console.error('❌ Database connection failed:', err.message);
});

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: true,
    credentials: true
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect Vercel environment and resolve paths correctly
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;

// Views path: In Vercel, views are in backend/dist/src/views relative to project root
// Locally, views are relative to __dirname (src/views)
const viewsPath = isVercel 
  ? path.join(process.cwd(), 'backend', 'dist', 'src', 'views')
  : path.join(__dirname, 'views');

// Static assets path: In Vercel, public is in backend/dist/public
// Locally, public is relative to __dirname (../public)
const staticPath = isVercel
  ? path.join(process.cwd(), 'backend', 'dist', 'public')
  : path.resolve(__dirname, '../public');

// Configure view engine for SSR
app.set('view engine', 'ejs');
app.set('views', viewsPath);


// Trust proxy - required for rate limiting to work correctly behind proxies
app.set('trust proxy', 1);

// Session configuration with MongoDB store for serverless persistence
const isProduction = process.env.NODE_ENV === 'production';
const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL;

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    proxy: isProduction, // Trust the reverse proxy in production
    // Use MongoDB store for persistent sessions (required for serverless)
    store: MongoStore.create({
      mongoUrl: mongoUri,
      dbName: 'ecms',
      collectionName: 'sessions',
      ttl: 24 * 60 * 60, // 24 hours in seconds
      autoRemove: 'native', // Use MongoDB TTL index for session cleanup
      touchAfter: 3600 // Only update session every hour (reduces DB writes)
    }),
    cookie: {
      secure: isProduction, // HTTPS only in production
      httpOnly: true,
      sameSite: isProduction ? 'lax' : 'lax', // 'lax' allows same-origin requests
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
app.use(
  '/static',
  express.static(staticPath, {
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

// Frontend assets route removed as frontend is archived
// const frontendAssetsPath = path.resolve(__dirname, '../../frontend/assets');
// app.use('/assets', express.static(frontendAssetsPath));

// Attach session user to locals for all templates
app.use(attachUserToLocals);

// SSR routes (must come before API routes)
app.use('/', authSSR);
app.use('/', viewRoutes);

// API docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.get('/docs.json', (_req, res) => res.json(openapiSpec));

// Middleware to ensure database is connected before handling API routes
app.use('/api', async (_req, _res, next) => {
  try {
    await dbConnectionPromise;
    next();
  } catch (err) {
    console.error('Database connection error in middleware:', err);
    next();
  }
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/superadmins', superAdminRouter);
app.use('/api/students', studentsRouter);
app.use('/api/teachers', teachersRouter);
app.use('/api/classes', classesRouter);
app.use('/api/subjects', subjectsRouter);
app.use('/api/academic-years', academicYearsRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/semesters', semestersRouter);

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

const port = Number(process.env.PORT) || 5000;

// Only start the server when executed directly (not during tests)
if (process.env.NODE_ENV !== 'test') {
  console.log('\n🚀 Starting ECMS Backend Server...\n');
  
  // Connect to database using required env URI (no local fallback)
  connectDatabase(process.env.MONGODB_URI || process.env.MONGODB_URL, 'ecms-api')
    .then(() => {
      console.log('✅ MongoDB connected successfully');
    })
    .catch((err) => {
      console.error('❌ Database connection failed:', err.message);
    });
  
  const retentionDaysEnv = Number(process.env.PROFILE_UPLOAD_RETENTION_DAYS);
  const intervalMsEnv = Number(process.env.PROFILE_UPLOAD_CLEANUP_INTERVAL_MS);
  
  startProfileUploadCleanupJob({
    retentionDays: Number.isFinite(retentionDaysEnv) ? retentionDaysEnv : undefined,
    intervalMs: Number.isFinite(intervalMsEnv) ? intervalMsEnv : undefined,
    logger: {
      error: console.error,
      info: (message?: any, ...optionalParams: any[]) => {
        if (typeof message === 'object' && message?.msg === 'profile-upload-cleanup' && message.deleted > 0) {
          console.log(`🧹 Profile cleanup: ${message.deleted} old files removed`);
        }
      }
    }
  });
  
  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log('\n┌──────────────────────────────────────────┐');
    console.log('│   🎓 ECMS Backend Server Running         │');
    console.log('├──────────────────────────────────────────┤');
    console.log(`│   📡 Port: ${port.toString().padEnd(29)} │`);
    console.log(`│   🌍 URL: http://localhost:${port.toString().padEnd(14)}│`);
    console.log(`│   📂 Environment: ${(process.env.NODE_ENV || 'development').padEnd(19)}    │`);
    console.log(`│   🔌 Socket.IO: Enabled                  │`);
    console.log('└──────────────────────────────────────────┘\n');
    console.log('💡 Press Ctrl+C to stop the server\n');
  });
}

export { app, io, httpServer };
