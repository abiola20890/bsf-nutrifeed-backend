import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    action: {
      type: String,
      enum: [
        'CREATE_FEED_RECORD',
        'UPDATE_FEED_RECORD',
        'DELETE_FEED_RECORD',
        'CREATE_MONITORING_LOG',
        'REGISTER',
        'LOGIN',
        'VIEW_REPORT',
        'PASSWORD_RESET',
      ],
      required: true,
    },

    resource: {
      type: String,
      enum: ['FeedRecord', 'MonitoringData', 'User'],
      required: true,
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    changes: {
      type: Object,
      default: null,
    },

    description: {
      type: String,
      trim: true,
    },

    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },

    endpoint: {
      type: String,
      trim: true,
    },

    ipAddress: {
      type: String,
      trim: true,
    },

    userAgent: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ['success', 'failed'],
      default: 'success',
    },
  },
  { timestamps: true }
);

// ── OPTIMIZED INDEXES ─────────────────────────

// 🔍 User activity timeline
auditLogSchema.index({ user: 1, createdAt: -1 });

// 🔍 Resource lookup
auditLogSchema.index({ resource: 1, resourceId: 1 });

// 🔍 Action filtering (for analytics)
auditLogSchema.index({ action: 1, createdAt: -1 });

// 🔍 Status tracking
auditLogSchema.index({ status: 1, createdAt: -1 });

// 🔍 Global sorting
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;