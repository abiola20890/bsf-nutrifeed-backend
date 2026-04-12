import rateLimit from 'express-rate-limit';
import { errorResponse } from '../utils/response.js';

// ── GLOBAL LIMITER ───────────────────────────────────
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(res, 'Too many requests. Please try again later.', 429);
  },
});

// ── AUTH LIMITER ─────────────────────────────────────
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    return errorResponse(res, 'Too many login attempts. Try again in 15 minutes.', 429);
  },
});

// ── REPORT LIMITER (heavier endpoints) ───────────────
export const reportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,             // max 10 report requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(res, 'Too many report requests. Please slow down.', 429);
  },
});

// ── STRICT LIMITER (password reset) ──────────────────
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,                    // max 3 password reset requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(res, 'Too many password reset requests. Try again in 1 hour.', 429);
  },
});