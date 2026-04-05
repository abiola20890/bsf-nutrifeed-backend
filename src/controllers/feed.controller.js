import mongoose from 'mongoose';
import FeedRecord from '../models/FeedRecord.js';
import cache, { clearCacheByPrefix } from '../utils/cache.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logAudit } from '../utils/auditLogger.js';
import {getChangedFields} from '../utils/diff.js';

// ── CREATE ──────────────────────────────────────────
export const createFeedRecord = async (req, res, next) => {
  try {
    const feedRecord = await FeedRecord.create({
      ...req.body,
      farmer: req.user._id,
    });

    clearCacheByPrefix(`feedRecords_${req.user._id}`);

    await logAudit({
      user: req.user._id,
      action: 'CREATE_FEED_RECORD',
      resource: 'FeedRecord',
      resourceId: feedRecord._id,
      changes: { created: feedRecord._id },
      description: 'Created a new feed record',
      req,
    });

    return successResponse(res, 'Feed record created', feedRecord, 201);
  } catch (error) {
    await logAudit({
      user: req.user?._id,
      action: 'CREATE_FEED_RECORD',
      resource: 'FeedRecord',
      resourceId: null,
      description: 'Failed to create feed record',
      req,
      status: 'failed',
    });

    next(error);
  }
};

// ── GET ALL FEED RECORDS ─────────────────────────────
// GET /api/feed
export const getFeedRecords = async (req, res, next) => {
  try {
    let { status, page = 1, limit = 10 } = req.query;

    page = Number(page) || 1;
    limit = Number(limit) || 10;

    // ✅ Cap limit to prevent large data dumps
    if (limit > 100) limit = 100;

    const cacheKey = `feedRecords_${req.user._id}_${status || 'all'}_${page}_${limit}`;

    // ✅ Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return successResponse(res, 'Feed records retrieved (cache)', cachedData);
    }

    const filter = {
      farmer: req.user._id,
      isDeleted: false, // ✅ exclude soft deleted
    };

    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      FeedRecord.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .lean({ virtuals: true }),

      FeedRecord.countDocuments(filter),
    ]);

    const responseData = {
      total,
      page,
      pages: Math.ceil(total / limit),
      data: records,
    };

    // ✅ Store in cache
    cache.set(cacheKey, responseData, 60);

    return successResponse(res, 'Feed records retrieved', responseData);
  } catch (error) {
    next(error);
  }
};

// ── GET SINGLE FEED RECORD ───────────────────────────
// GET /api/feed/:id
export const getFeedRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ✅ Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid record ID', 400);
    }

    const cacheKey = `feedRecord_${id}_${req.user._id}`;

    // ✅ Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      return successResponse(res, 'Feed record retrieved (cache)', cached);
    }

    const record = await FeedRecord.findOne({
      _id: id,
      farmer: req.user._id,
      isDeleted: false,
    })
      .select('-__v')
      .lean({ virtuals: true });

    if (!record) {
      return errorResponse(res, 'Feed record not found', 404);
    }

    // ✅ Save to cache
    cache.set(cacheKey, record, 60);

    return successResponse(res, 'Feed record retrieved', record);
  } catch (error) {
    next(error);
  }
};

// ── UPDATE (WITH DIFF) ──────────────────────────────
export const updateFeedRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid record ID', 400);
    }

    const existing = await FeedRecord.findOne({
      _id: id,
      farmer: req.user._id,
      isDeleted: false,
    });

    if (!existing) {
      return errorResponse(res, 'Feed record not found', 404);
    }

    // ✅ Keep endDate validation
    const endDate = req.body.endDate
      ? new Date(req.body.endDate)
      : existing.endDate;

    const startDate = req.body.startDate
      ? new Date(req.body.startDate)
      : existing.startDate;

    if (endDate && startDate && endDate <= startDate) {
      return errorResponse(res, 'End date must be after start date', 400);
    }

    if (endDate && req.body.status !== 'failed') {
      req.body.status = 'completed';
    }

    const previousData = existing.toObject();

    Object.assign(existing, req.body);
    await existing.save();

    const newData = existing.toObject();

    // ✅ GET ONLY CHANGED FIELDS
    const changes = getChangedFields(previousData, newData);

    clearCacheByPrefix(`feedRecords_${req.user._id}`);
    cache.del(`feedRecord_${id}_${req.user._id}`);

    if (Object.keys(changes).length > 0) {
      await logAudit({
        user: req.user._id,
        action: 'UPDATE_FEED_RECORD',
        resource: 'FeedRecord',
        resourceId: existing._id,
        changes,
        description: 'Updated feed record fields',
        req,
      });
    }

    return successResponse(res, 'Feed record updated', existing);
  } catch (error) {
    await logAudit({
      user: req.user?._id,
      action: 'UPDATE_FEED_RECORD',
      resource: 'FeedRecord',
      resourceId: req.params?.id,
      description: 'Failed to update feed record',
      req,
      status: 'failed',
    });
    next(error);
  }
};

// ── DELETE ──────────────────────────────────────────
export const deleteFeedRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid record ID', 400);
    }

    const record = await FeedRecord.findOneAndUpdate(
      {
        _id: id,
        farmer: req.user._id,
        isDeleted: false,
      },
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    );

    if (!record) {
      return errorResponse(res, 'Record not found', 404);
    }

    clearCacheByPrefix(`feedRecords_${req.user._id}`);
    cache.del(`feedRecord_${id}_${req.user._id}`);

    await logAudit({
      user: req.user._id,
      action: 'DELETE_FEED_RECORD',
      resource: 'FeedRecord',
      resourceId: record._id,
      changes: { deleted: true },
      description: 'Soft deleted feed record',
      req,
    });

    return successResponse(res, 'Feed record deleted');
  } catch (error) {
    await logAudit({
      user: req.user?._id,
      action: 'DELETE_FEED_RECORD',
      resource: 'FeedRecord',
      resourceId: req.params?.id,
      description: 'Failed to delete feed record',
      req,
      status: 'failed',
    });

    next(error);
  }
};