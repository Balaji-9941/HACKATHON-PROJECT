const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Alert = require('../models/Alert');
const Customer = require('../models/Customer');
const AuditLog = require('../models/AuditLog');
const ModelPerformanceSnapshot = require('../models/ModelPerformanceSnapshot');
const { requireAuth } = require('../middleware/auth');

// GET /api/admin/metrics (Live metrics strip derived from DB)
router.get('/metrics', requireAuth, async (req, res) => {
  try {
    const totalTransactions = await Transaction.countDocuments();
    const highRiskTransactions = await Transaction.countDocuments({ alertSeverity: { $in: ['high', 'critical'] } });
    const openAlerts = await Alert.countDocuments({ status: { $in: ['Open', 'Investigating'] } });
    const resolvedAlerts = await Alert.countDocuments({ status: 'Resolved' });
    const falsePositives = await Alert.countDocuments({ status: 'False Positive' });

    // Recent 100 latency sample for real avg latency
    const recentTxns = await Transaction.find().sort({ timestamp: -1 }).limit(100).select('latencyMs totalRiskScore');
    const avgLatency = recentTxns.length > 0
      ? Number((recentTxns.reduce((acc, t) => acc + (t.latencyMs || 12), 0) / recentTxns.length).toFixed(1))
      : 14.5;

    // Fraud rate
    const fraudRate = totalTransactions > 0
      ? Number(((highRiskTransactions / totalTransactions) * 100).toFixed(2))
      : 0;

    res.json({
      totalTransactions,
      highRiskTransactions,
      openAlerts,
      resolvedAlerts,
      falsePositives,
      avgLatencyMs: avgLatency,
      fraudRatePercent: fraudRate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/audit-log
router.get('/audit-log', requireAuth, async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(Number(limit));
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const networkGraphEngine = require('../engine/networkGraphEngine');
const adaptiveThresholdEngine = require('../engine/adaptiveThresholdEngine');

// GET /api/admin/network (Global network graph)
router.get('/network', requireAuth, async (req, res) => {
  try {
    const { limit = 150 } = req.query;
    const graph = await networkGraphEngine.buildGraph(null, Number(limit));
    res.json(graph);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/network/:customerId (Customer local subgraph)
router.get('/network/:customerId', requireAuth, async (req, res) => {
  try {
    const graph = await networkGraphEngine.buildGraph(req.params.customerId, 100);
    res.json(graph);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/thresholds
router.get('/thresholds', requireAuth, async (req, res) => {
  try {
    const metrics = await adaptiveThresholdEngine.evaluateMetrics(200);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/thresholds/recalibrate
router.post('/thresholds/recalibrate', requireAuth, async (req, res) => {
  try {
    const io = req.app.get('io');
    const result = await adaptiveThresholdEngine.recalibrate(io);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/performance
router.get('/performance', requireAuth, async (req, res) => {
  try {
    const snapshots = await ModelPerformanceSnapshot.find().sort({ timestamp: -1 }).limit(30);
    res.json(snapshots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/customers/:id/baseline
router.get('/customers/:id/baseline', requireAuth, async (req, res) => {
  try {
    const customer = await Customer.findOne({ customerId: req.params.id });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const recentTxns = await Transaction.find({ customerId: req.params.id }).sort({ timestamp: -1 }).limit(20);
    res.json({ customer, recentTransactions: recentTxns });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
