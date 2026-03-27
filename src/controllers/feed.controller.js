import FeedRecord from '../models/FeedRecord.js';
import { successResponse, errorResponse } from '../utils/response.js';

// ── CREATE FEED RECORD ───────────────────────────────
// POST /api/feed
export const createFeedRecord = async (req, res, next) => {
  try {
    const feedRecord = await FeedRecord.create({
      ...req.body,
      farmer: req.user._id,
    });

    return successResponse(
      res,
      'Feed record created successfully',
      feedRecord,
      201
    );
  } catch (error) {
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

    const filter = { farmer: req.user._id };

    if (status) {
      filter.status = status;
    }

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

    return successResponse(res, 'Feed records retrieved', {
      total,
      page,
      pages: Math.ceil(total / limit),
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET SINGLE FEED RECORD ───────────────────────────
// GET /api/feed/:id
export const getFeedRecord = async (req, res, next) => {
  try {
    const record = await FeedRecord.findOne({
      _id: req.params.id,
      farmer: req.user._id,
    })
      .select('-__v')
      .lean({ virtuals: true });

    if (!record) {
      return errorResponse(res, 'Feed record not found', 404);
    }

    return successResponse(res, 'Feed record retrieved', record);
  } catch (error) {
    next(error);
  }
};

// ── UPDATE FEED RECORD ───────────────────────────────
// PUT /api/feed/:id
export const updateFeedRecord = async (req, res, next) => {
  try {
    // ✅ Fetch existing record first
    const existing = await FeedRecord.findOne({
      _id: req.params.id,
      farmer: req.user._id,
    });

    if (!existing) {
      return errorResponse(res, 'Feed record not found', 404);
    }

    // ✅ Validate endDate against existing startDate
    const endDate = req.body.endDate
      ? new Date(req.body.endDate)
      : existing.endDate;

    const startDate = req.body.startDate
      ? new Date(req.body.startDate)
      : existing.startDate;

    if (endDate && startDate && endDate <= startDate) {
      return errorResponse(res, 'End date must be after start date', 400);
    }

    // ✅ Auto-set status to completed if endDate is being set
    if (endDate && req.body.status !== 'failed') {
      req.body.status = 'completed';
    }

    // ✅ Apply updates manually and save
    // triggers pre-save hooks, virtuals and toJSON()
    Object.assign(existing, req.body);
    await existing.save();

    return successResponse(res, 'Feed record updated', existing);
  } catch (error) {
    next(error);
  }
};

// ── DELETE FEED RECORD ───────────────────────────────
// DELETE /api/feed/:id
export const deleteFeedRecord = async (req, res, next) => {
  try {
    const record = await FeedRecord.findOneAndDelete({
      _id: req.params.id,
      farmer: req.user._id,
    });

    if (!record) {
      return errorResponse(res, 'Feed record not found', 404);
    }

    return successResponse(res, 'Feed record deleted');
  } catch (error) {
    next(error);
  }
};