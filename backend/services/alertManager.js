const Alert = require('../models/Alert');
const { logAuditEvent } = require('./auditLogger');

/**
 * Creates or updates an investigation alert for high/critical transactions
 * @param {Object} transaction Scored transaction document
 * @param {Object} customer Customer document
 * @param {Object} io Socket.io instance for real-time broadcast
 */
const handleTransactionAlert = async (transaction, customer, io = null) => {
  // Only high (71-85) and critical (86-100) automatically spawn investigation alerts
  if (!['high', 'critical'].includes(transaction.alertSeverity)) {
    return null;
  }

  try {
    // Find linked alerts (same customer or same device)
    const existingAlerts = await Alert.find({
      $or: [
        { customerId: transaction.customerId },
        { fraudExplanation: { $regex: transaction.location || 'nomatch', $options: 'i' } }
      ]
    }).limit(5).select('alertId');

    const linkedAlertIds = existingAlerts.map(a => a.alertId);
    const alertId = `ALT-${Date.now()}-${Math.floor(1000 + (transaction.totalRiskScore * 7))}`;

    const newAlert = await Alert.create({
      alertId,
      transactionId: transaction.transactionId,
      customerId: transaction.customerId,
      customerName: customer.name || 'Customer',
      severity: transaction.alertSeverity,
      status: 'Open',
      assignedTo: 'unassigned',
      fraudExplanation: transaction.fraudExplanation,
      riskScoreAtCreation: transaction.totalRiskScore,
      linkedAlerts: linkedAlertIds,
      createdAt: new Date()
    });

    await logAuditEvent({
      actor: 'AlertManager',
      action: 'ALERT_AUTO_CREATED',
      entity: 'Alert',
      entityId: alertId,
      newState: {
        transactionId: transaction.transactionId,
        severity: transaction.alertSeverity,
        riskScore: transaction.totalRiskScore
      }
    });

    if (io) {
      io.emit('admin:new_alert', newAlert);
    }

    return newAlert;
  } catch (error) {
    console.error('[AlertManager Error]: Failed to create alert:', error.message);
    return null;
  }
};

module.exports = { handleTransactionAlert };
