import { Router } from 'express';
import mongoose from 'mongoose';
import FeedRecord from '../models/FeedRecord.js';
import MonitoringData from '../models/MonitoringData.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { generateChecksum } from '../utils/checkSum.js';

const router = Router();

router.use(protect);
router.use(restrictTo('admin'));

/**
 * @swagger
 * /api/v1/integrity/verify/{id}:
 *   get:
 *     summary: Verify feed record integrity
 *     tags: [Integrity]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Integrity check result
 *       404:
 *         description: Record not found
 */
router.get('/verify/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 'Invalid ID', 400);
    }

    const record = await FeedRecord.findById(req.params.id)
      .select('+checksum');

    if (!record) return errorResponse(res, 'Record not found', 404);

    const expected = generateChecksum({
      batchId:   record.batchId,
      farmer:    record.farmer,
      inputs:    record.inputs,
      outputs:   record.outputs,
      startDate: record.startDate,
    });

    const isValid = expected === record.checksum;

    return successResponse(res, 'Integrity check complete', {
      recordId:  record._id,
      batchId:   record.batchId,
      isValid,
      status:    isValid ? 'INTACT' : 'TAMPERED',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/integrity/audit-trail/{id}:
 *   get:
 *     summary: Get full audit trail for a feed record
 *     tags: [Integrity]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audit trail retrieved
 */
router.get('/audit-trail/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 'Invalid ID', 400);
    }

    const AuditLog = mongoose.model('AuditLog');

    const [record, auditTrail, monitoringLogs] = await Promise.all([
      FeedRecord.findById(req.params.id),
      AuditLog.find({ resourceId: req.params.id })
        .sort({ createdAt: 1 })
        .populate('user', 'name email role')
        .lean(),
      MonitoringData.find({ feedRecord: req.params.id })
        .sort({ logDate: 1 })
        .lean(),
    ]);

    if (!record) return errorResponse(res, 'Record not found', 404);

    return successResponse(res, 'Audit trail retrieved', {
      record,
      auditTrail,
      monitoringLogs,
      summary: {
        totalChanges:   auditTrail.length,
        totalLogs:      monitoringLogs.length,
        firstActivity:  auditTrail[0]?.createdAt || null,
        lastActivity:   auditTrail[auditTrail.length - 1]?.createdAt || null,
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;