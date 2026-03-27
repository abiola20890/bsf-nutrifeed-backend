import { errorResponse } from '../utils/response.js';

// ── 404 NOT FOUND ────────────────────────────────────
export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};


// ── GLOBAL ERROR HANDLER ─────────────────────────────
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // ── DEV LOGGING ───────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ ERROR:', err);
  }

  // ── MONGOOSE VALIDATION ERROR ────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // ── DUPLICATE KEY ERROR ──────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = err.keyValue
      ? Object.keys(err.keyValue)[0]
      : 'Field';
    message = `${field} already exists`;
  }

  // ── CAST ERROR (INVALID OBJECT ID) ───────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // ── JWT ERRORS ───────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Token expired. Please log in again', 401);
  }

  // ── ZOD VALIDATION ERROR (🔥 IMPORTANT) ───────────
  if (err.name === 'ZodError') {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // ── DEFAULT RESPONSE ─────────────────────────────
  return errorResponse(
    res,
    process.env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : message,
    statusCode
  );
};