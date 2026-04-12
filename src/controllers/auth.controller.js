import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/user.model.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logAudit } from '../utils/auditLogger.js';
import { sendEmail } from '../utils/sendEmail.js';
import { isBlacklisted } from '../utils/tokenBlacklist.js'
import {
  recordFailedAttempt,
  isAccountLocked,
  clearAttempts
} from '../utils/loginAttempts.js'

// ── REGISTER ──────────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, farmName, location } = req.body;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return errorResponse(res, 'Email already registered', 409);
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role,
      farmName,
      location,
      hasAcceptedTerms: true,
      termsAcceptedAt: new Date(),
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await logAudit({
      user: user._id,
      action: 'REGISTER',
      resource: 'User',
      resourceId: user._id,
      changes: {
        created: {
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      description: 'User registered',
      req,
    });

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
    await logAudit({
      user: null,
      action: 'REGISTER',
      resource: 'User',
      resourceId: null,
      description: 'Failed registration attempt',
      req,
      status: 'failed',
    });

    next(error);
  }
};

// ── LOGIN ─────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    //  Check account lockout
    if (isAccountLocked(normalizedEmail)) {
      return errorResponse(
        res,
        'Account temporarily locked due to too many failed attempts. Try again in 15 minutes.',
        423
      );
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      recordFailedAttempt(normalizedEmail);
      await logAudit({ user: null, action: 'LOGIN', resource: 'User', resourceId: null, description: `Failed login — email not found: ${normalizedEmail}`, req, status: 'failed' });
      return errorResponse(res, 'Invalid email or password', 401);
    }

    if (!user.isActive) {
      await logAudit({ user: user._id, action: 'LOGIN', resource: 'User', resourceId: user._id, description: 'Login on deactivated account', req, status: 'failed' });
      return errorResponse(res, 'Account is deactivated', 403);
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      const locked = recordFailedAttempt(normalizedEmail);
      await logAudit({ user: user._id, action: 'LOGIN', resource: 'User', resourceId: user._id, description: 'Invalid password attempt', req, status: 'failed' });

      if (locked) {
        return errorResponse(res, 'Account temporarily locked due to too many failed attempts. Try again in 15 minutes.', 423);
      }

      return errorResponse(res, 'Invalid email or password', 401);
    }

    //  Clear failed attempts on successful login
    clearAttempts(normalizedEmail);

    const accessToken  = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await logAudit({ user: user._id, action: 'LOGIN', resource: 'User', resourceId: user._id, description: 'User logged in successfully', req, status: 'success' });

    return successResponse(res, 'Login successful', {
      user: {
        id: user._id, name: user.name, email: user.email,
        role: user.role, farmName: user.farmName, location: user.location,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};


// ── GET CURRENT USER ──────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      farmName: user.farmName,
      location: user.location,
    };

    return successResponse(res, 'User retrieved', safeUser);
  } catch (error) {
    next(error);
  }
};

// ── REFRESH TOKEN ─────────────────────────────────────
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: incomingRefreshToken } = req.body;

    if (!incomingRefreshToken) {
      return errorResponse(res, 'Refresh token is required', 400);
    }

    let decoded;
    try {
      decoded = jwt.verify(
        incomingRefreshToken,
        process.env.JWT_REFRESH_SECRET
      );
    } catch (err) {
      return errorResponse(res, 'Invalid or expired refresh token', 401);
    }

    const user = await User.findById(decoded.id).select('_id isActive role');
    if (!user) {
      return errorResponse(res, 'User no longer exists', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Account is deactivated', 403);
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    return successResponse(res, 'Token refreshed successfully', {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// ── LOGOUT ────────────────────────────────────────────
export const logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if(token) {
      blacklistToken(token);
    }

    await logAudit({
      user: req.user._id,
      action: 'LOGIN',
      resource: 'User',
      resourceId: 'req.user._id',
      description: 'user logged out - token blacklisted',
      req,
      status: 'success'
    });

    return successResponse(res, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

// ── FORGOT PASSWORD (FIXED) ───────────────────────────
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return successResponse(
        res,
        'If that email exists, a reset link has been sent'
      );
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save({ validateBeforeSave: false });

    // log reset token in development for testing
    console.log(`🔐 Password reset token for ${user.email}: ${resetToken}`);
    console.log(`Reset URL: http://localhost:5000/reset-password/${resetToken}`);

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // ALWAYS SEND EMAIL
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset',
        html: `
          <h2>Reset Your Password</h2>
          <p>Click the link below:</p>
          <a href="${resetUrl}">${resetUrl}</a>
          <p>This link expires in 10 minutes</p>
        `,
      });
    } catch (err) {
      console.error('Email failed:', err.message);
    }

    // Optional: log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 Reset link: ${resetUrl}`);
    }

    return successResponse(
      res,
      'If that email exists, a reset link has been sent'
    );
  } catch (error) {
    next(error);
  }
};

// ── RESET PASSWORD ────────────────────────────────────
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return errorResponse(res, 'Invalid or expired reset token', 400);
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await logAudit({
      user: user._id,
      action: 'PASSWORD_RESET',
      resource: 'User',
      resourceId: user._id,
      description: 'Password reset successfully',
      req,
      status: 'success',
    });

    return successResponse(res, 'Password reset successfully', {
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};