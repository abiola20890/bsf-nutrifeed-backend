import { Router } from 'express';
import mongoose from 'mongoose';
import AuditLog from '../models/auditLog.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { successResponse, errorResponse } from '../utils/response.js';

const router = Router();

router.use(protect);
router.use(restrictTo('admin'));

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: Get all audit logs (Admin only)
 *     description: Retrieve system audit logs with filtering, search, and pagination
 *     tags: [Audit]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [CREATE_FEED_RECORD, UPDATE_FEED_RECORD, DELETE_FEED_RECORD, CREATE_MONITORING_LOG, REGISTER, LOGIN, VIEW_REPORT]
 *         description: Filter by action type
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *           enum: [FeedRecord, MonitoringData, User]
 *         description: Filter by resource type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [success, failed]
 *         description: Filter by status
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search logs by description
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: -createdAt
 *         description: Sort field (e.g. -createdAt, action)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 50
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         pages:
 *                           type: integer
 *                           example: 3
 *                         count:
 *                           type: integer
 *                           example: 20
 *                         data:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/AuditLog'
 *       400:
 *         description: Invalid user ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized (No token)
 *       403:
 *         description: Forbidden (Admin only)
 */
router.get('/', async (req, res, next) => {
  try {
    let {
      page = 1,
      limit = 20,
      action,
      resource,
      status,
      user,
      from,
      to,
      search,
      sort = '-createdAt',
    } = req.query;

    // ── PAGINATION ───────────────────────────────────
    page = Number(page) || 1;
    limit = Number(limit) || 20;
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;

    const filter = {};

    // ── FILTERS ──────────────────────────────────────
    if (action) filter.action = action;
    if (resource) filter.resource = resource;
    if (status) filter.status = status;

    // ── USER FILTER ──────────────────────────────────
    if (user) {
      if (!mongoose.Types.ObjectId.isValid(user)) {
        return errorResponse(res, 'Invalid user ID', 400);
      }
      filter.user = user;
    }

    // ── DATE FILTER ──────────────────────────────────
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    // ── SEARCH ───────────────────────────────────────
    if (search) {
      filter.description = { $regex: search, $options: 'i' };
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email role')
        .select('action resource resourceId changes status description method endpoint createdAt user')
        .lean(),

      AuditLog.countDocuments(filter),
    ]);

    return successResponse(res, 'Audit logs retrieved', {
      total,
      page,
      pages: Math.ceil(total / limit),
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
});

export default router;