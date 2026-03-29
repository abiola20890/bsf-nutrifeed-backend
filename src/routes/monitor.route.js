import { Router } from 'express';
import {
  createLog,
  getLogs,
  getDashboard,
} from '../controllers/monitor.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import { validateObjectId } from '../middlewares/validateObjectId.js';
import { createLogSchema } from '../validation/monitor.validation.js';

const router = Router();

router.use(protect);

/**
 * @swagger
 * /api/monitor:
 *   post:
 *     summary: Submit a daily monitoring log
 *     tags: [Monitoring]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MonitoringInput'
 *     responses:
 *       201:
 *         description: Monitoring log created successfully
 *       409:
 *         description: A log for this batch already exists for today
 */
router.post('/', validate(createLogSchema), createLog);

/**
 * @swagger
 * /api/monitor/dashboard:
 *   get:
 *     summary: Get dashboard metrics for logged-in farmer
 *     tags: [Monitoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 overview:
 *                   totalBatches: 1
 *                   ongoingBatches: 0
 *                   completedBatches: 1
 *                   totalFeedProduced: 25
 *                 recentLogs: []
 */
router.get('/dashboard', getDashboard);

/**
 * @swagger
 * /api/monitor/{feedRecordId}:
 *   get:
 *     summary: Get all monitoring logs for a feed record
 *     tags: [Monitoring]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: feedRecordId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Monitoring logs retrieved
 *       404:
 *         description: Feed record not found
 */
router.get('/:feedRecordId', validateObjectId('feedRecordId'), getLogs);

export default router;