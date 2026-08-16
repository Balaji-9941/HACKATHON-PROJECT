const mongoose = require('mongoose');

const modelPerformanceSnapshotSchema = new mongoose.Schema({
  snapshotId: {
    type: String,
    default: () => `SNAP-${Date.now()}-${Math.floor(1000 + ((Date.now() % 1000) * 8))}`
  },
  timestamp: { type: Date, default: Date.now, index: true },
  precision: { type: Number, required: true },
  recall: { type: Number, required: true },
  f1: { type: Number, required: true },
  thresholds: {
    low: { type: Number, default: 30 },
    medium: { type: Number, default: 50 },
    high: { type: Number, default: 70 },
    critical: { type: Number, default: 85 }
  },
  sampleSize: { type: Number, default: 0 },
  modelTier: { type: Number, default: 1 }
}, {
  timestamps: true
});

module.exports = mongoose.model('ModelPerformanceSnapshot', modelPerformanceSnapshotSchema);
