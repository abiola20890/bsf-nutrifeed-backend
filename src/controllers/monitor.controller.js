import mongoose from 'mongoose';
import MonitoringData from '../models/MonitoringData.js';
import FeedRecord from '../models/FeedRecord.js';
import { successResponse, errorResponse } from '../utils/response.js';

// ── CREATE MONITORING LOG ────────────────────────────
// POST /api/monitor
export const createLog = async (req, res, next) => {
  try {
    const { feedRecord } = req.body;

    // ✅ Validate ObjectId early
    if (!mongoose.Types.ObjectId.isValid(feedRecord)) {
      return errorResponse(res, 'Invalid feed record ID', 400);
    }

    // Verify ownership
    const existingFeed = await FeedRecord.findOne({
      _id: feedRecord,
      farmer: req.user._id,
    });

    if (!existingFeed) {
      return errorResponse(res, 'Feed record not found', 404);
    }

    const log = await MonitoringData.create({
      ...req.body,
      farmer: req.user._id,
    });

    // ✅ Re-fetch to get virtuals via toJSON()
    const populatedLog = await MonitoringData.findById(log._id);

    return successResponse(
      res,
      'Monitoring log created successfully',
      populatedLog,
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

    let { page = 1, limit = 10 } = req.query;
    page = Number(page) || 1;
    limit = Number(limit) || 10;

    const skip = (page - 1) * limit;

    const filter = {
      feedRecord: feedRecordId,
      farmer: req.user._id,
    };

    const [logs, total] = await Promise.all([
      MonitoringData.find(filter)
        .sort({ logDate: -1 })
        .skip(skip)
        .limit(limit), // ✅ no .lean() — toJSON() handles virtuals & __v

      MonitoringData.countDocuments(filter),
    ]);

    return successResponse(res, 'Monitoring logs retrieved', {
      total,
      page,
      pages: Math.ceil(total / limit),
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// ── DASHBOARD METRICS ────────────────────────────────
// GET /api/monitor/dashboard
export const getDashboard = async (req, res, next) => {
  try {
    const farmerId = req.user._id;

    const [
      totalBatches,
      ongoingBatches,
      completedBatches,
      feedAgg,
      recentLogs,
    ] = await Promise.all([

      // Total batches
      FeedRecord.countDocuments({ farmer: farmerId }),

      // Ongoing batches
      FeedRecord.countDocuments({
        farmer: farmerId,
        status: 'ongoing',
      }),

      // Completed batches
      FeedRecord.countDocuments({
        farmer: farmerId,
        status: 'completed',
      }),

      // Total feed produced
      FeedRecord.aggregate([
        { $match: { farmer: farmerId } },
        {
          $group: {
            _id: null,
            total: { $sum: '$outputs.feedProduced' },
          },
        },
      ]),

      // Recent logs ✅ no .lean() — toJSON() handles virtuals & __v
      MonitoringData.find({ farmer: farmerId })
        .sort({ logDate: -1 })
        .limit(5)
        .populate('feedRecord', 'batchId status inputs outputs') // populate batchId, status, inputs, outputs
    ]);

    return successResponse(res, 'Dashboard metrics retrieved', {
      overview: {
        totalBatches,
        ongoingBatches,
        completedBatches,
        totalFeedProduced: feedAgg[0]?.total || 0,
      },
      recentLogs,
    });
  } catch (error) {
    next(error);
  }
};