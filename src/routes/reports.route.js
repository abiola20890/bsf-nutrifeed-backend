import { Router } from 'express';
import {
  getProductionReport,
  getBatchReport,
  getAnalytics,
  getAllFarmersReport,
} from '../controllers/report.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(protect);

/**
 * @swagger
 * /api/reports/production:
 *   get:
 *     summary: Get full farm production report
 *     description: Returns aggregated production metrics and feed records
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ongoing, completed, failed]
 *         description: Filter by batch status
 *     responses:
 *       200:
 *         description: Production report retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/production', getProductionReport);

/**
 * @swagger
 * /api/reports/analytics:
 *   get:
 *     summary: Get analytics dashboard data
 *     description: Returns aggregated analytics like trends, growth stages, and top batches
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/analytics', getAnalytics);

/**
 * @swagger
 * /api/reports/batch/{batchId}:
 *   get:
 *     summary: Get detailed report for a specific batch
 *     description: Returns monitoring logs and performance metrics for a batch
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *         description: The batch ID (e.g. BATCH-001)
 *     responses:
 *       200:
 *         description: Batch report retrieved successfully
 *       404:
 *         description: Batch not found
 *       401:
 *         description: Unauthorized
 */
router.get('/batch/:batchId', getBatchReport);

/**
 * @swagger
 * /api/reports/admin/all:
 *   get:
 *     summary: Get report for all farmers (admin only)
 *     description: Returns aggregated data for all registered farmers
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All farmers report retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (non-admin user)
 */
router.get('/admin/all', restrictTo('admin'), getAllFarmersReport);

export default router;