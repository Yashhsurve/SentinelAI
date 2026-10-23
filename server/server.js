import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import messageRoutes from './routes/messageRoutes.js';
import codeRoutes from './routes/codeRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

export const app = express();

// 1. Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", config.clientOrigin],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// 2. Restrictive CORS Policy
const allowedOrigins = [
  config.clientOrigin,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or supertest)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Cross-Origin Request Blocked by SentinelAI Security Policy'));
    },
    credentials: true,
  })
);

// 3. Rate Limiter (Defense against DoS and API abuse)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 120,                 // Limit each IP to 120 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many security scan requests from this IP address. Please try again in 15 minutes.',
  },
});

app.use('/api/', apiLimiter);

// 4. Request Body Size Limiter (Strict 1MB max)
app.use(express.json({ limit: '1mb' }));

// 5. Mount API Routes
app.use('/api', healthRoutes);
app.use('/api', messageRoutes);
app.use('/api', codeRoutes);

// 6. Serve static production client build if available (e.g. Google Cloud Run)
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) next();
  });
});

// 6. Generic Error Handling Middleware (Never leak stack traces)
app.use((err, req, res, next) => {
  logger.error('Unhandled server exception', err);
  const status = err.status || 500;
  res.status(status).json({
    error: 'Security Gateway Error',
    message: config.nodeEnv === 'production'
      ? 'An unexpected error occurred during analysis.'
      : err.message || 'Internal server error',
  });
});

// Start server if not running in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    logger.info(`🛡️ SentinelAI Security Server active on port ${config.port}`);
    logger.info(`Operating Mode: ${config.isDemoMode ? 'Demo Mode (Deterministic Rule Engine)' : 'Live Mode (Gemini GenAI Active)'}`);
    logger.info(`Model: ${config.geminiModel}`);
  });
}
