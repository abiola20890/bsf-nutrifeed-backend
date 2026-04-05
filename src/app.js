import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { globalLimiter } from './middlewares/rateLimiter.js';

import authRoutes from './routes/auth.route.js';
import feedRoutes from './routes/feed.route.js';
import monitorRoutes from './routes/monitor.route.js';
import reportRoutes from './routes/reports.route.js';
import auditRoutes from './routes/audit.route.js';

import 'dotenv/config';

// ── ESM __dirname ────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ── LOGS DIRECTORY ───────────────────────────────────
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ── ACCESS LOG FILE ──────────────────────────────────
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

// ── SECURITY ─────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// ── CORS ─────────────────────────────────────────────
app.use(cors());

// ── RATE LIMIT ───────────────────────────────────────
app.use(globalLimiter);

// ── LOGGING ──────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(morgan('combined', { stream: accessLogStream }));

// ── BODY PARSER ──────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── SWAGGER ──────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── HEALTH CHECK ─────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running ✅',
    environment: process.env.NODE_ENV,
  });
});

// 
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BSF Nutrifeed API 🚀',
    docs: '/api-docs',
    health: '/health',
  });
});

// ── ROUTES ───────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/monitor', monitorRoutes);
app.use('/api/reports', reportRoutes); // ✅ FIXED
app.use('/api/audit', auditRoutes);

// ── 404 ──────────────────────────────────────────────
app.use(notFound);

// ── ERROR HANDLER ────────────────────────────────────
app.use(errorHandler);

export default app;