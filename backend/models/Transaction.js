const mongoose = require('mongoose');

const explanationFactorSchema = new mongoose.Schema({
  factor: { type: String, required: true },
  contribution: { type: Number, required: true },
  plainText: { type: String, required: true }
}, { _id: false });

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true, index: true },
  customerId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  recipientUpiId: { type: String, required: true },
  recipientName: { type: String, required: true },
  merchantCategory: { type: String, default: 'peer_to_peer' },
  location: { type: String, default: 'Bangalore, IN' },
  deviceId: { type: String, default: 'dev-001' },
  deviceName: { type: String, default: 'Pixel-8-Pro' },
  timestamp: { type: Date, default: Date.now, index: true },
  note: { type: String, default: '' },
  status: { type: String, default: 'SETTLED' },
  dataSource: { type: String, default: 'live' },
  rawFeatures: { type: Object, default: {} },
  isSimulatedScenario: { type: Boolean, default: false },
  scenarioType: { type: String, default: null },
  flowSource: {
    type: String,
    enum: ['consumer', 'consumer_live', 'autoflow_replay', 'autoflow_scenario', 'autoflow_stream', 'manual_injection'],
    default: 'consumer',
    index: true
  },

  // Tier 1 — deterministic rule + Mahalanobis
  totalRiskScore: { type: Number, required: true, min: 0, max: 100 },
  riskBreakdown: {
    amountAnomaly: { type: Number, default: 0 },
    velocityBurst: { type: Number, default: 0 },
    deviceNovelty: { type: Number, default: 0 },
    locationVariance: { type: Number, default: 0 },
    temporalDeviation: { type: Number, default: 0 },
    merchantRisk: { type: Number, default: 0 },
    networkConsistency: { type: Number, default: 0 }
  },
  anomalyFeatures: { type: [Number], default: [] },
  fraudExplanation: { type: String, default: 'Transaction within normal risk parameters.' },
  explanationFactors: { type: [explanationFactorSchema], default: [] },

  // Tier 2 — ML enhancement (null-safe)
  modelTier: { type: Number, enum: [1, 2], default: 1 },
  mlProbability: { type: Number, default: null },
  shapValues: { type: Object, default: null },
  modelVersion: { type: String, default: 'tier1-deterministic-v1' },
  aiNarrative: { type: String, default: null },

  alertSeverity: { type: String, enum: ['none', 'low', 'medium', 'high', 'critical'], default: 'none' },
  userFrictionLevel: { type: String, enum: ['none', 'banner', 'confirm', 'stepup', 'stepup_alert'], default: 'none' },
  latencyMs: { type: Number, default: 0 },
  groundTruthLabel: { type: Number, default: null },
  userAcknowledgedAt: { type: Date, default: null }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);
