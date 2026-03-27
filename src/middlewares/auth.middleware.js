import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { errorResponse } from '../utils/response.js';


// ── PROTECT (JWT VERIFICATION) ───────────────────────
export const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Extract token safely
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 'Access denied. No token provided', 401);
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return errorResponse(res, 'Invalid token payload', 401);
    }

    // 3. Fetch user (exclude unnecessary fields)
    const user = await User.findById(decoded.id).select(
      '_id name email role isActive'
    );

    if (!user) {
      return errorResponse(res, 'User no longer exists', 401);
    }

    // 4. Check if user is active
    if (!user.isActive) {
      return errorResponse(res, 'Account is deactivated', 403);
    }

    // 5. Attach user to request
    req.user = user;

    next();
  } catch (error) {
    // JWT specific errors
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token', 401);
    }

    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired. Please log in again', 401);
    }

    next(error);
  }
};


// ── RESTRICT TO (ROLE-BASED ACCESS) ──────────────────
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Not authenticated', 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        'You do not have permission to perform this action',
        403
      );
    }

    next();
  };
};