import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoSanitize from 'express-mongo-sanitize';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { globalLimiter } from './middlewares/rateLimiter.js';
import { requestLogger, suspiciousActivityDetector } from './middlewares/securityMiddleware.js';
import authRoutes    from './routes/auth.route.js';
import feedRoutes    from './routes/feed.route.js';
import monitorRoutes from './routes/monitor.route.js';
import reportRoutes  from './routes/reports.route.js';
import auditRoutes   from './routes/audit.route.js';
import complianceRoutes from './routes/compliance.route.js';
import integrityRoutes from './routes/integrity.route.js';
import { malwareProtection, blockFileUploads, blockMaliciousIPs } from './middlewares/malwareProtection.js';
import securityRoutes from './routes/security.route.js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

// ── LOGS DIRECTORY ───────────────────────────────────
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'), { flags: 'a' }
);

// ── CORS ─────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── RATE LIMITING ─────────────────────────────────────
app.use(globalLimiter);

// ── SECURITY HEADERS ─────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      scriptSrc:  ["'self'"],
      imgSrc:     ["'self'", 'data:'],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff:    true,
  frameguard: { action: 'deny' },
}));

// ── LOGGING ──────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(morgan('combined', { stream: accessLogStream }));

// ── BODY PARSING + PAYLOAD LIMIT ─────────────────────
app.use(express.json({ limit: '10kb' }));               
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── NOSQL INJECTION PROTECTION ────────────────────────
app.use(mongoSanitize()); // noSQL injection prevention
app.use(suspiciousActivityDetector); // pattern-based detection
app.use(requestLogger); // security logging   

// ── MALWARE PROTECTION ───────────────────────────────
app.use(blockMaliciousIPs); // block known bad IPs
app.use(blockFileUploads); // block file upload attempts
app.use(malwareProtection); // block malicious payloads

// ── SWAGGER DOCS ─────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'BSF-Nutrifeed API Docs',
  customCss: '.swagger-ui .topbar { background-color: #1B6B3A; }',
}));

// ── VERSION ENDPOINT ─────────────────────────────────
app.get('/api/v1/version', (req, res) => {             
  res.status(200).json({
    success: true,
    data: {
      name:        'BSF-Nutrifeed API',
      version:     '2.0.0',
      environment: process.env.NODE_ENV,
      timestamp:   new Date().toISOString(),
      uptime:      `${Math.floor(process.uptime())} seconds`,
    }
  });
});

// ── HEALTH CHECK ─────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success:     true,
    message:     'BSF-Nutrifeed API is running ✅',
    environment: process.env.NODE_ENV,
    timestamp:   new Date().toISOString(),
  });
});

// ── API ROUTES  ────────────────────────────
app.use('/api/v1/auth',    authRoutes);                
app.use('/api/v1/feed',    feedRoutes);
app.use('/api/v1/monitor', monitorRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/audit',   auditRoutes);
app.use('/api/v1/compliance', complianceRoutes);
app.use('/api/v1/integrity', integrityRoutes);
app.use('/api/v1/security', securityRoutes);


// ── 404 & ERROR HANDLERS ─────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;