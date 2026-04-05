import mongoose from 'mongoose';
import FeedRecord from '../models/FeedRecord.js';
import MonitoringData from '../models/MonitoringData.js';
import { successResponse, errorResponse } from '../utils/response.js';
import cache, { clearCacheByPrefix } from '../utils/cache.js';
import { logAudit } from '../utils/auditLogger.js';

// ── HELPERS ──────────────────────────────────────────
const toValidDate = (date) => {
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
};

// ── FARM PRODUCTION REPORT ───────────────────────────
export const getProductionReport = async (req, res, next) => {
  try {
    const farmerId = req.user._id;
    const farmerObjectId = new mongoose.Types.ObjectId(farmerId);

    let { startDate, endDate, status } = req.query;

    startDate = toValidDate(startDate);
    endDate = toValidDate(endDate);

    const cacheKey = `report_production_${farmerId}_${startDate || 'all'}_${endDate || 'all'}_${status || 'all'}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      return successResponse(res, 'Production report retrieved (cache)', cached);
    }

    const filter = { farmer: farmerId, isDeleted: false };

    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = startDate;
      if (endDate) filter.startDate.$lte = endDate;
    }

    const [records, productionStats, statusBreakdown] = await Promise.all([

      FeedRecord.find(filter)
        .sort({ createdAt: -1 })
        .select('-__v')
        .lean({ virtuals: true }),

      FeedRecord.aggregate([
        { $match: { farmer: farmerObjectId, isDeleted: false } },
        {
          $group: {
            _id: null,
            totalOrganicWaste: { $sum: '$inputs.organicWaste' },
            totalWaterUsed: { $sum: '$inputs.waterUsed' },
            totalFeedProduced: { $sum: '$outputs.feedProduced' },
            totalLarvaeHarvested: { $sum: '$outputs.larvaeHarvested' },
            totalCompost: { $sum: '$outputs.compostGenerated' },
            avgEfficiency: {
              $avg: {
                $cond: [
                  { $gt: ['$inputs.organicWaste', 0] },
                  { $divide: ['$outputs.feedProduced', '$inputs.organicWaste'] },
                  0,
                ],
              },
            },
            totalBatches: { $sum: 1 },
          },
        },
      ]),

      FeedRecord.aggregate([
        { $match: { farmer: farmerObjectId, isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const stats = productionStats[0] || {};

    const breakdown = statusBreakdown.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const data = {
      summary: {
        totalBatches: stats.totalBatches || 0,
        ongoing: breakdown.ongoing || 0,
        completed: breakdown.completed || 0,
        failed: breakdown.failed || 0,
        totalOrganicWaste: `${(stats.totalOrganicWaste || 0).toFixed(2)} kg`,
        totalWaterUsed: `${(stats.totalWaterUsed || 0).toFixed(2)} L`,
        totalFeedProduced: `${(stats.totalFeedProduced || 0).toFixed(2)} kg`,
        totalLarvaeHarvested: `${(stats.totalLarvaeHarvested || 0).toFixed(2)} kg`,
        totalCompostGenerated: `${(stats.totalCompost || 0).toFixed(2)} kg`,
        averageEfficiency: `${((stats.avgEfficiency || 0) * 100).toFixed(1)}%`,
      },
      records,
    };

    cache.set(cacheKey, data, 120);

    // ✅ Optional audit (lightweight)
    await logAudit({
      user: farmerId,
      action: 'VIEW_REPORT',
      resource: 'FeedRecord',
      resourceId: null,
      description: 'Viewed production report',
      req,
    });

    return successResponse(res, 'Production report retrieved', data);
  } catch (error) {
    next(error);
  }
};

// ── BATCH REPORT ─────────────────────────────────────
export const getBatchReport = async (req, res, next) => {
  try {
    const farmerId = req.user._id;
    const { batchId } = req.params;

    const cacheKey = `report_batch_${batchId}_${farmerId}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      return successResponse(res, 'Batch report retrieved (cache)', cached);
    }

    const feedRecord = await FeedRecord.findOne({
      batchId: batchId.toUpperCase(),
      farmer: farmerId,
      isDeleted: false,
    });

    if (!feedRecord) {
      return errorResponse(res, 'Batch not found', 404);
    }

    const [logs, monitorStats] = await Promise.all([
      MonitoringData.find({ feedRecord: feedRecord._id })
        .sort({ logDate: 1 })
        .lean(),

      MonitoringData.aggregate([
        { $match: { feedRecord: feedRecord._id } },
        {
          $group: {
            _id: null,
            avgWeight: { $avg: '$larvaeGrowth.currentWeight' },
            avgMortality: { $avg: '$larvaeGrowth.mortality' },
            avgTemperature: { $avg: '$environment.temperature' },
            avgHumidity: { $avg: '$environment.humidity' },
            avgPH: { $avg: '$environment.pH' },
            totalDailyInput: { $sum: '$dailyInput' },
            totalDailyOutput: { $sum: '$dailyOutput' },
            totalLogs: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = monitorStats[0] || {};

    const data = {
      batch: feedRecord,
      monitoringSummary: {
        totalLogs: stats.totalLogs || 0,
        avgLarvaeWeight: `${(stats.avgWeight || 0).toFixed(2)} g`,
        avgMortality: `${(stats.avgMortality || 0).toFixed(2)}%`,
        avgTemperature: `${(stats.avgTemperature || 0).toFixed(1)}°C`,
        avgHumidity: `${(stats.avgHumidity || 0).toFixed(1)}%`,
        avgPH: `${(stats.avgPH || 0).toFixed(2)}`,
        totalFeedConsumed: `${(stats.totalDailyInput || 0).toFixed(2)} g`,
        totalWasteProcessed: `${(stats.totalDailyOutput || 0).toFixed(2)} g`,
      },
      logs,
    };

    cache.set(cacheKey, data, 120);

    await logAudit({
      user: farmerId,
      action: 'VIEW_REPORT',
      resource: 'FeedRecord',
      resourceId: feedRecord._id,
      description: `Viewed batch report (${batchId})`,
      req,
    });

    return successResponse(res, 'Batch report retrieved', data);
  } catch (error) {
    next(error);
  }
};

// ── ANALYTICS ────────────────────────────────────────
export const getAnalytics = async (req, res, next) => {
  try {
    const farmerId = req.user._id;
    const farmerObjectId = new mongoose.Types.ObjectId(farmerId);

    const cacheKey = `analytics_${farmerId}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      return successResponse(res, 'Analytics retrieved (cache)', cached);
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const [
      monthlyProduction,
      growthStageBreakdown,
      mortalityTrend,
      topBatches,
    ] = await Promise.all([

      FeedRecord.aggregate([
        {
          $match: {
            farmer: farmerObjectId,
            isDeleted: false,
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            feedProduced: { $sum: '$outputs.feedProduced' },
            organicWaste: { $sum: '$inputs.organicWaste' },
            batchCount: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),

      MonitoringData.aggregate([
        { $match: { farmer: farmerObjectId } },
        { $group: { _id: '$larvaeGrowth.growthStage', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      MonitoringData.aggregate([
        {
          $match: {
            farmer: farmerObjectId,
            logDate: { $gte: fourteenDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$logDate' },
            },
            avgMortality: { $avg: '$larvaeGrowth.mortality' },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      FeedRecord.aggregate([
        {
          $match: {
            farmer: farmerObjectId,
            isDeleted: false,
            status: 'completed',
            'inputs.organicWaste': { $gt: 0 },
          },
        },
        {
          $addFields: {
            efficiency: {
              $divide: ['$outputs.feedProduced', '$inputs.organicWaste'],
            },
          },
        },
        { $sort: { efficiency: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const data = {
      monthlyProduction,
      growthStageBreakdown,
      mortalityTrend,
      topBatches,
    };

    cache.set(cacheKey, data, 120);

    await logAudit({
      user: farmerId,
      action: 'VIEW_REPORT',
      resource: 'FeedRecord',
      resourceId: null,
      description: 'Viewed analytics dashboard',
      req,
    });

    return successResponse(res, 'Analytics retrieved', data);
  } catch (error) {
    next(error);
  }
};

// ── ALL FARMERS REPORT (ADMIN ONLY) ──────────────────
// GET /api/reports/admin/all
export const getAllFarmersReport = async (req, res, next) => {
  try {
    const cacheKey = 'admin_report_all';
    const cached = cache.get(cacheKey);
    if (cached) {
      return successResponse(res, 'All farmers report retrieved (cache)', cached);
    }

    const [totalFarmers, totalBatches, totalFeedProduced, topFarmers] =
      await Promise.all([

        // Total registered farmers
        mongoose.model('User').countDocuments({ role: 'farmer', isActive: true }),

        // Total batches across all farmers
        FeedRecord.countDocuments({ isDeleted: false }),

        // Total feed produced across all farmers
        FeedRecord.aggregate([
          { $match: { isDeleted: false } },
          { $group: { _id: null, total: { $sum: '$outputs.feedProduced' } } },
        ]),

        // Top 5 most productive farmers
        FeedRecord.aggregate([
          { $match: { isDeleted: false } },
          {
            $group: {
              _id: '$farmer',
              totalFeedProduced: { $sum: '$outputs.feedProduced' },
              totalBatches:      { $sum: 1 },
            }
          },
          { $sort: { totalFeedProduced: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'farmer',
            }
          },
          { $unwind: '$farmer' },
          {
            $project: {
              totalFeedProduced: 1,
              totalBatches: 1,
              'farmer.name':     1,
              'farmer.farmName': 1,
              'farmer.location': 1,
            }
          }
        ]),
      ]);

    const data = {
      platform: {
        totalFarmers,
        totalBatches,
        totalFeedProduced: totalFeedProduced[0]?.total || 0,
      },
      topFarmers,
    };

    cache.set(cacheKey, data, 300); // cache for 5 minutes
    return successResponse(res, 'All farmers report retrieved', data);
  } catch (error) {
    next(error);
  }
};