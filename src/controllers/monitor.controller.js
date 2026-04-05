import mongoose from 'mongoose';
import MonitoringData from '../models/MonitoringData.js';
import FeedRecord from '../models/FeedRecord.js';
import cache, { clearCacheByPrefix } from '../utils/cache.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logAudit } from '../utils/auditLogger.js';

// ── CREATE MONITORING LOG ────────────────────────────
// POST /api/monitor
export const createLog = async (req, res, next) => {
  try {
    const { feedRecord } = req.body;

    await logAudit({
      user: req.user._id,
      action: 'CREATE_MONITOR_LOG',
      resource: 'MonitoringData',
      resourceId: log._id,
      changes: { created: log._id },
      description: 'Created daily monitoring log',
      req,
    });

    // ✅ Validate ObjectId early
    if (!mongoose.Types.ObjectId.isValid(feedRecord)) {
      return errorResponse(res, 'Invalid feed record ID', 400);
    }

    // Verify ownership
    const existingFeed = await FeedRecord.findOne({
      _id: feedRecord,
      farmer: req.user._id,
      isDeleted: false,
    });

    if (!existingFeed) {
      return errorResponse(res, 'Feed record not found', 404);
    }

    const log = await MonitoringData.create({
      ...req.body,
      farmer: req.user._id,
    });
   

    // 🧹 Clear related cache
    clearCacheByPrefix(`logs_${feedRecord}`);
    cache.del(`dashboard_${req.user._id}`);

    // ✅ Use toJSON() instead of re-fetching from DB
    return successResponse(
      res,
      'Monitoring log created successfully',
      log.toJSON(),
      201
    );
  } catch (error) {
    // Handle duplicate log (same feedRecord + same day)
    if (error.code === 11000) {
      return errorResponse(
        res,
        'A log for this batch already exists for today',
        409
      );
    }
    next(error);
  }
};

// ── GET LOGS FOR A FEED RECORD ───────────────────────
// GET /api/monitor/:feedRecordId
export const getLogs = async (req, res, next) => {
  try {
    const { feedRecordId } = req.params;

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(feedRecordId)) {
      return errorResponse(res, 'Invalid feed record ID', 400);
    }

    // ✅ Check feedRecord exists and belongs to farmer
    const feedExists = await FeedRecord.findOne({
      _id: feedRecordId,
      farmer: req.user._id,
      isDeleted: false,
    });

    if (!feedExists) {
      return errorResponse(res, 'Feed record not found', 404);
    }

    let { page = 1, limit = 10 } = req.query;
    page = Number(page) || 1;
    limit = Number(limit) || 10;

    // ✅ Cap limit
    if (limit > 100) limit = 100;

    const cacheKey = `logs_${feedRecordId}_${req.user._id}_${page}_${limit}`;

    // ✅ Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      return successResponse(res, 'Monitoring logs retrieved (cache)', cached);
    }

    const filter = {
      feedRecord: feedRecordId,
      farmer: req.user._id,
    };

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      MonitoringData.find(filter)
        .sort({ logDate: -1 })
        .skip(skip)
        .limit(limit),

      MonitoringData.countDocuments(filter),
    ]);

    const responseData = {
      total,
      page,
      pages: Math.ceil(total / limit),
      data: logs,
    };

    // ✅ Store in cache
    cache.set(cacheKey, responseData, 60);

    return successResponse(res, 'Monitoring logs retrieved', responseData);
  } catch (error) {
    next(error);
  }
};

// ── DASHBOARD METRICS ────────────────────────────────
// GET /api/monitor/dashboard
export const getDashboard = async (req, res, next) => {
  try {
    const farmerId = req.user._id.toString();

    // ✅ Check cache first
    const cacheKey = `dashboard_${farmerId}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return successResponse(res, 'Dashboard metrics retrieved (cached)', cachedData);
    }

    const [
      totalBatches,
      ongoingBatches,
      completedBatches,
      feedAgg,
      recentLogs,
    ] = await Promise.all([

      // Total batches
      FeedRecord.countDocuments({ farmer: farmerId, isDeleted: false }),

      // Ongoing batches
      FeedRecord.countDocuments({
        farmer: farmerId,
        status: 'ongoing',
        isDeleted: false,
      }),

      // Completed batches
      FeedRecord.countDocuments({
        farmer: farmerId,
        status: 'completed',
        isDeleted: false,
      }),

      // Total feed produced
      FeedRecord.aggregate([
        { $match: { farmer: req.user._id, isDeleted: false } },
        {
          $group: {
            _id: null,
            total: { $sum: '$outputs.feedProduced' },
          },
        },
      ]),

      // Recent logs
      MonitoringData.find({ farmer: farmerId })
        .sort({ logDate: -1 })
        .limit(5)
        .populate('feedRecord', 'batchId status inputs outputs'),
    ]);

    const data = {
      overview: {
        totalBatches,
        ongoingBatches,
        completedBatches,
        totalFeedProduced: feedAgg[0]?.total || 0,
      },
      recentLogs,
    };

    // ✅ Store in cache for 60 seconds
    cache.set(cacheKey, data, 60);

    return successResponse(res, 'Dashboard metrics retrieved', data);
  } catch (error) {
    next(error);
  }
};