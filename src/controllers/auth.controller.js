import User from '../models/user.model.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { successResponse, errorResponse } from '../utils/response.js';

// ── REGISTER ─────────────────────────────────────────
// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, farmName, location } = req.body;
    const normalizedEmail = email.toLowerCase();

    // Check if email exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return errorResponse(res, 'Email already registered', 409);
    }

    // Create user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role,
      farmName,
      location,
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    return successResponse(
      res,
      'Registration successful',
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          farmName: user.farmName,
          location: user.location,
        },
        accessToken,
        refreshToken,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// ── LOGIN ─────────────────────────────────────────────
// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    // Get user with password
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Check if active
    if (!user.isActive) {
      return errorResponse(res, 'Account is deactivated', 403);
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    return successResponse(res, 'Login successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        farmName: user.farmName,
        location: user.location,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET CURRENT USER ──────────────────────────────────
// GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    return successResponse(res, 'User retrieved', user);
  } catch (error) {
    next(error);
  }
};
