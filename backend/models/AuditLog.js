const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  actor: { type: String, required: true }, // e.g. "System", "analyst1", "consumer"
  action: { type: String, required: true }, // e.g. "ALERT_STATUS_UPDATE", "TRANSACTION_SCORED", "THRESHOLD_RECALIBRATED"
  entity: { type: String, required: true }, // e.g. "Alert", "Transaction", "Threshold"
  entityId: { type: String, required: true, index: true },
  previousState: { type: Object, default: null },
  newState: { type: Object, default: null }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
