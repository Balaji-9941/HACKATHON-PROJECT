const AuditLog = require('../models/AuditLog');

/**
 * Single centralized call-site for writing all audit logs
 * @param {Object} logEntry { actor, action, entity, entityId, previousState, newState }
 */
const logAuditEvent = async ({ actor = 'System', action, entity, entityId, previousState = null, newState = null }) => {
  try {
    const log = await AuditLog.create({
      actor,
      action,
      entity,
      entityId,
      previousState,
      newState,
      timestamp: new Date()
    });
    return log;
  } catch (error) {
    console.error('[AuditLogger Error]: Failed to write audit entry:', error.message);
    return null;
  }
};

module.exports = { logAuditEvent };
