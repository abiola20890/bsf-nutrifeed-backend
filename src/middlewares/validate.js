import { errorResponse } from '../utils/response.js';

// ── ZOD VALIDATION MIDDLEWARE ────────────────────────
export const validate = (schema) => (req, res, next) => {
  // ✅ Skip validation for requests with no body
  if (!req.body || Object.keys(req.body).length === 0) {
    return next();
  }

  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    return errorResponse(res, 'Validation failed', 400, errors);
  }

  req.body = result.data;
  next();
};

