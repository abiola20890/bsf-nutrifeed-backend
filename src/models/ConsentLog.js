import mongoose from 'mongoose';

const consentLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    consentType: {
      type: String,
      enum: [
        'TERMS_OF_SERVICE',
        'PRIVACY_POLICY',
        'DATA_PROCESSING',
        'MARKETING',
      ],
      required: true,
    },
    granted: {
      type: Boolean,
      required: true,
    },
    ipAddress: { type: String },
    userAgent:  { type: String },
    version:    { type: String, default: '1.0' }, // policy version
  },
  { timestamps: true }
);

consentLogSchema.index({ user: 1, consentType: 1 });
consentLogSchema.index({ createdAt: -1 });

const ConsentLog = mongoose.model('ConsentLog', consentLogSchema);
export default ConsentLog;