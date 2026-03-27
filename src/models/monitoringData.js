import mongoose from 'mongoose';

const monitoringDataSchema = new mongoose.Schema(
  {
    feedRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeedRecord',
      required: [true, 'Feed record reference is required'],
    },

    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer reference is required'],
    },

    // LARVAE GROWTH
    larvaeGrowth: {
      currentWeight: {
        type: Number, // grams
        required: [true, 'Current larvae weight is required'],
        min: [0, 'Value cannot be negative'],
      },
      growthStage: {
        type: String,
        enum: ['egg', 'young_larvae', 'mature_larvae', 'prepupae'],
        required: [true, 'Growth stage is required'],
      },
      mortality: {
        type: Number, // %
        default: 0,
        min: [0, 'Value cannot be negative'],
        max: [100, 'Value cannot exceed 100'],
      },
    },

    // ENVIRONMENT 
    environment: {
      temperature: {
        type: Number, // °C
        min: [0, 'Value cannot be negative'],
      },
      humidity: {
        type: Number, // %
        min: [0, 'Value cannot be negative'],
        max: [100, 'Value cannot exceed 100'],
      },
      pH: {
        type: Number,
        min: [0, 'Value cannot be negative'],
        max: [14, 'Value cannot exceed 14'],
      },
    },

    //  DAILY OPERATIONS 
    dailyInput: {
      type: Number, // grams
      default: 0,
      min: [0, 'Value cannot be negative'],
    },

    dailyOutput: {
      type: Number, // grams
      default: 0,
      min: [0, 'Value cannot be negative'],
    },

    logDate: {
      type: Date,
      default: Date.now,
    },

    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


// INDEXES 

// Ensure one log per feedRecord per day
monitoringDataSchema.index(
  { feedRecord: 1, logDate: 1 },
  { unique: true }
);

// Query optimization
monitoringDataSchema.index({ farmer: 1 });
monitoringDataSchema.index({ createdAt: -1 });


//  NORMALIZE DATE 
// Ensures same day = same record

monitoringDataSchema.pre('save', function () {
  if (this.logDate) {
    const date = new Date(this.logDate);
    date.setHours(0, 0, 0, 0); // normalize to midnight
    this.logDate = date;
  };
});


// VIRTUAL: DAILY EFFICIENCY 
// efficiency = output / input

monitoringDataSchema.virtual('dailyEfficiency').get(function () {
  if (!this.dailyInput || this.dailyInput === 0) return 0;

  return (this.dailyOutput / this.dailyInput).toFixed(2);
});


//  VIRTUAL: MORTALITY STATUS 

monitoringDataSchema.virtual('mortalityStatus').get(function () {
  const m = this.larvaeGrowth?.mortality || 0;

  if (m < 5) return 'healthy';
  if (m < 15) return 'moderate';
  return 'critical';
});


//  CLEAN RESPONSE 

monitoringDataSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};


const MonitoringData = mongoose.model(
  'MonitoringData',
  monitoringDataSchema
);

export default MonitoringData;