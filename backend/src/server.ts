import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';

const app = express();

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
  res.status(200).json({ status: 'ok', service: 'backend', ts: new Date().toISOString() });
});

const port = process.env.PORT || 5000;

// Only start the server when executed directly (not during tests)
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    // Basic startup log; replace with structured logger later
    console.log(`API listening on port ${port}`);
  });
}

export { app };
