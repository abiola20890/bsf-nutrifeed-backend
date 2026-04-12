import { Router } from 'express';
import User from '../models/user.model.js';
import FeedRecord from '../models/FeedRecord.js';
import MonitoringData from '../models/MonitoringData.js';
import AuditLog from '../models/auditLog.js';
import ConsentLog from '../models/ConsentLog.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logAudit } from '../utils/auditLogger.js';
import { anonymizeUser } from '../utils/anonymize.js';

const router = Router();
router.use(protect);

// ── PRIVACY POLICY ───────────────────────────────────
/**
 * @swagger
 * /api/v1/compliance/privacy-policy:
 *   get:
 *     summary: Get privacy policy
 *     tags: [Compliance]
 *     responses:
 *       200:
 *         description: Privacy policy retrieved
 */
router.get('/privacy-policy', (req, res) => {
  return successResponse(res, 'Privacy policy retrieved', {
    version:      '1.0',
    effectiveDate:'2026-01-01',
    lastUpdated:  '2026-04-01',
    framework:    ['NDPR', 'GDPR-aligned'],
    contact:      'privacy@bsfnutrifeed.com',
    policy: {
      dataCollected: [
        'Name, email address and farm location',
        'Feed production records and batch data',
        'Daily larvae monitoring logs',
        'Login activity and IP addresses',
      ],
      dataPurpose: [
        'Providing BSF feed production tracking services',
        'Improving platform performance and reliability',
        'Ensuring system security and fraud prevention',
      ],
      dataRetention: '2 years from last activity',
      userRights: [
        'Right to access your data',
        'Right to correct inaccurate data',
        'Right to erasure (delete your account)',
        'Right to data portability (export your data)',
        'Right to withdraw consent',
      ],
      thirdPartySharing: 'No data is sold or shared with third parties',
      security: 'All data encrypted in transit (HTTPS/TLS). Passwords hashed with bcrypt.',
    }
  });
});

// ── RECORD CONSENT ───────────────────────────────────
/**
 * @swagger
 * /api/v1/compliance/consent:
 *   post:
 *     summary: Record user consent
 *     tags: [Compliance]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [consentType, granted]
 *             properties:
 *               consentType:
 *                 type: string
 *                 enum: [TERMS_OF_SERVICE, PRIVACY_POLICY, DATA_PROCESSING, MARKETING]
 *               granted:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Consent recorded
 */
router.post('/consent', async (req, res, next) => {
  try {
    const { consentType, granted } = req.body;

    const consent = await ConsentLog.create({
      user:        req.user._id,
      consentType,
      granted,
      ipAddress:   req.ip,
      userAgent:   req.headers['user-agent'],
    });

    return successResponse(res, 'Consent recorded', consent, 201);
  } catch (error) {
    next(error);
  }
});

// ── GET MY CONSENTS ──────────────────────────────────
/**
 * @swagger
 * /api/v1/compliance/consent:
 *   get:
 *     summary: Get my consent history
 *     tags: [Compliance]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Consent history retrieved
 */
router.get('/consent', async (req, res, next) => {
  try {
    const consents = await ConsentLog.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(res, 'Consent history retrieved', consents);
  } catch (error) {
    next(error);
  }
});

// ── RIGHT TO ACCESS — EXPORT MY DATA ─────────────────
/**
 * @swagger
 * /api/v1/compliance/my-data:
 *   get:
 *     summary: Export all my data (right to portability)
 *     tags: [Compliance]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Full data export
 */
router.get('/my-data', async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [user, feedRecords, monitoringLogs, auditLogs, consents] =
      await Promise.all([
        User.findById(userId).lean(),
        FeedRecord.find({ farmer: userId, isDeleted: false }).lean(),
        MonitoringData.find({ farmer: userId }).lean(),
        AuditLog.find({ user: userId }).lean(),
        ConsentLog.find({ user: userId }).lean(),
      ]);

    await logAudit({
      user:        userId,
      action:      'LOGIN',
      resource:    'User',
      resourceId:  userId,
      description: 'User requested full data export (NDPR right to access)',
      req,
    });

    return successResponse(res, 'Your data export', {
      exportedAt:     new Date().toISOString(),
      dataController: 'BSF-Nutrifeed · Otondo Team by DSHub',
      framework:      'NDPR / GDPR-aligned',
      data: {
        profile:        user,
        feedRecords,
        monitoringLogs,
        auditLogs,
        consents,
      },
      summary: {
        totalFeedRecords:    feedRecords.length,
        totalMonitoringLogs: monitoringLogs.length,
        totalAuditEvents:    auditLogs.length,
        totalConsents:       consents.length,
      }
    });
  } catch (error) {
    next(error);
  }
});

// ── RIGHT TO ERASURE — DELETE MY ACCOUNT ─────────────
/**
 * @swagger
 * /api/v1/compliance/delete-account:
 *   delete:
 *     summary: Delete my account (right to erasure)
 *     tags: [Compliance]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 */
router.delete('/delete-account', async (req, res, next) => {
  try {
    const userId = req.user._id;

    // ✅ Soft delete feed records
    await FeedRecord.updateMany(
      { farmer: userId },
      { isDeleted: true, deletedAt: new Date() }
    );

    // ✅ Anonymize user — don't hard delete (preserve audit integrity)
    await User.findByIdAndUpdate(userId, {
      name:      'Deleted User',
      email:     `deleted_${userId}@anonymized.com`,
      farmName:  'Anonymized',
      location:  'Anonymized',
      isActive:  false,
      password:  'DELETED',
    });

    await logAudit({
      user:        userId,
      action:      'LOGIN',
      resource:    'User',
      resourceId:  userId,
      description: 'User requested account deletion (NDPR right to erasure)',
      req,
      status:      'success',
    });

    return successResponse(res, 'Account deleted successfully. Your data has been anonymized.');
  } catch (error) {
    next(error);
  }
});

// ── DATA ACCESS LOGS (ADMIN ONLY) ────────────────────
/**
 * @swagger
 * /api/v1/compliance/data-access-logs:
 *   get:
 *     summary: View data access logs — admin only
 *     tags: [Compliance]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Data access logs retrieved
 */
router.get('/data-access-logs',
  restrictTo('admin'),
  async (req, res, next) => {
    try {
      let { page = 1, limit = 20 } = req.query;
      page  = Number(page)  || 1;
      limit = Number(limit) || 20;
      if (limit > 100) limit = 100;

      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        AuditLog.find({
          action: { $in: ['LOGIN', 'REGISTER'] }
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('user', 'name email role')
          .lean(),
        AuditLog.countDocuments({
          action: { $in: ['LOGIN', 'REGISTER'] }
        }),
      ]);

      // ✅ Anonymize sensitive fields for NDPR compliance
      const anonymized = logs.map(log => ({
        ...log,
        user: log.user ? anonymizeUser(log.user) : null,
        ipAddress: log.ipAddress
          ? log.ipAddress.split('.').slice(0, 2).join('.') + '.*.*'
          : null,
      }));

      return successResponse(res, 'Data access logs retrieved', {
        total, page,
        pages: Math.ceil(total / limit),
        data:  anonymized,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;