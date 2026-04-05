import mongoose from 'mongoose';

const feedRecordSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer reference is required'],
    },

    batchId: {
      type: String,
      required: [true, 'Batch ID is required'],
      trim: true,
      uppercase: true,
    },

    // ── INPUTS ──────────────────────────────────────
    inputs: {
      organicWaste: {
        type: Number, // kg
        required: [true, 'Organic waste input is required'],
        min: [0, 'Value cannot be negative'],
      },
      waterUsed: {
        type: Number, // litres
        default: 0,
        min: [0, 'Value cannot be negative'],
      },
      additives: {
        type: String,
        trim: true,
      },
    },

    // ── OUTPUTS ─────────────────────────────────────
    outputs: {
      feedProduced: {
        type: Number, // kg
        default: 0,
        min: [0, 'Value cannot be negative'],
      },
      larvaeHarvested: {
        type: Number, // kg
        default: 0,
        min: [0, 'Value cannot be negative'],
      },
      compostGenerated: {
        type: Number, // kg
        default: 0,
        min: [0, 'Value cannot be negative'],
      },
    },

    status: {
      type: String,
      enum: ['ongoing', 'completed', 'failed'],
      default: 'ongoing',
    },

    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },

    endDate: {
      type: Date,
    },

    notes: {
      type: String,
      trim: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── INDEXES ──────────────────────────────────────────
feedRecordSchema.index({ farmer: 1, batchId: 1 }, { unique: true });
feedRecordSchema.index({ status: 1 });
feedRecordSchema.index({ createdAt: -1 });
feedRecordSchema.index({ isDeleted: 1 }); // ✅ index for soft delete queries

// ── VIRTUAL: FEED EFFICIENCY ─────────────────────────
feedRecordSchema.virtual('efficiency').get(function () {
  if (!this.inputs?.organicWaste || this.inputs.organicWaste === 0) return 0;
  return (this.outputs.feedProduced / this.inputs.organicWaste).toFixed(2);
});

// ── PRE-SAVE LOGIC ───────────────────────────────────
// ✅ Fixed syntax — removed misplaced semicolon, added next
feedRecordSchema.pre('save', function () {
  if (this.endDate && this.status === 'ongoing') {
    this.status = 'completed';
  };
});

// ── CLEAN RESPONSE ───────────────────────────────────
feedRecordSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const FeedRecord = mongoose.model('FeedRecord', feedRecordSchema);

export default FeedRecord;