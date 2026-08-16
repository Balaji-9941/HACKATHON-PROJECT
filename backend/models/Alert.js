const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  alertId: { type: String, required: true, unique: true, index: true },
  transactionId: { type: String, required: true, index: true },
  customerId: { type: String, required: true, index: true },
  customerName: { type: String, required: true },
  severity: {
    type: String,
    enum: ['none', 'low', 'medium', 'high', 'critical'],
    default: 'high',
    index: true
  },
  status: {
    type: String,
    enum: ['Open', 'Investigating', 'Resolved', 'False Positive'],
    default: 'Open',
    index: true
  },
  assignedTo: { type: String, default: 'unassigned' },
  fraudExplanation: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date, default: null },
  resolutionNotes: { type: String, default: '' },
  riskScoreAtCreation: { type: Number, required: true },
  linkedAlerts: { type: [String], default: [] }
}, {
  timestamps: true
});

module.exports = mongoose.model('Alert', alertSchema);
