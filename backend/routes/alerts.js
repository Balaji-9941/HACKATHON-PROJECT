const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const { requireAuth } = require('../middleware/auth');
const { logAuditEvent } = require('../services/auditLogger');

// GET /api/admin/alerts (investigator alert queue)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, severity, limit = 50 } = req.query;
    let query = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;

    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/alerts/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const alert = await Alert.findOne({ alertId: req.params.id });
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/alerts/:id (update status, assign, resolve)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { status, assignedTo, resolutionNotes } = req.body;
    const prevAlert = await Alert.findOne({ alertId: req.params.id });
    if (!prevAlert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const updates = {};
    if (status) updates.status = status;
    if (assignedTo) updates.assignedTo = assignedTo;
    if (resolutionNotes) updates.resolutionNotes = resolutionNotes;
    if (status === 'Resolved' || status === 'False Positive') {
      updates.resolvedAt = new Date();
    }

    const updatedAlert = await Alert.findOneAndUpdate(
      { alertId: req.params.id },
      { $set: updates },
      { new: true }
    );

    await logAuditEvent({
      actor: req.user?.username || 'investigator',
      action: 'ALERT_STATUS_UPDATED',
      entity: 'Alert',
      entityId: req.params.id,
      previousState: { status: prevAlert.status, assignedTo: prevAlert.assignedTo },
      newState: { status: updatedAlert.status, assignedTo: updatedAlert.assignedTo, notes: resolutionNotes }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('admin:alert_updated', updatedAlert);
    }

    res.json(updatedAlert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
