import rateLimit from 'express-rate-limit';
import { errorResponse } from '../utils/response.js';

// ── GLOBAL RATE LIMITER ──────────────────────────────
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    return errorResponse(
      res,
      'Too many requests. Please try again later.',
      429
    );
  },
});

// ── AUTH RATE LIMITER (STRICTER) ─────────────────────
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 login attempts
  standardHeaders: true,
  legacyHeaders: false,

  // ✅ Do not count successful requests
  skipSuccessfulRequests: true,

  handler: (req, res) => {
    return errorResponse(
      res,
      'Too many login attempts. Please try again in 15 minutes.',
      429
    );
  },
});