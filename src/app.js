import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// ── MIDDLEWARE ───────────────────────────────────────
import { errorHandler, notFound } from './middlewares/errorHandler.js';

// ── ROUTES ───────────────────────────────────────────
import authRoutes from './routes/auth.route.js';
import feedRoutes from './routes/feed.route.js';
import monitorRoutes from './routes/monitor.route.js';

const app = express();

// ── GLOBAL MIDDLEWARE ────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── HEALTH CHECK ─────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'BSF-Nutrifeed API is running ✅' });
});

// ── API ROUTES ───────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/feed',     feedRoutes);
app.use('/api/monitor',  monitorRoutes);

// ── 404 HANDLER ──────────────────────────────────────
app.use(notFound);

// ── ERROR HANDLER ────────────────────────────────────
app.use(errorHandler);

export default app;