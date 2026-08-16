const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const networkGraphEngine = require('../engine/networkGraphEngine');
const adaptiveThresholdEngine = require('../engine/adaptiveThresholdEngine');
const narrativeEngine = require('../engine/narrativeEngine');
const { logAuditEvent } = require('../services/auditLogger');
const AuditLog = require('../models/AuditLog');

test.before(async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect('mongodb://127.0.0.1:27017/paytelemetry');
  }
});

test.after(() => {});

test('Innovation Module: Network Graph Engine builds valid graph with flagged nodes', async () => {
  const graph = await networkGraphEngine.buildGraph(null, 50);

  assert.ok(graph);
  assert.ok(Array.isArray(graph.nodes));
  assert.ok(Array.isArray(graph.links));
  assert.ok(graph.nodes.length > 0, 'Graph should have nodes');
  assert.ok(graph.links.length > 0, 'Graph should have links');

  // Verify node structure
  const firstNode = graph.nodes[0];
  assert.ok(firstNode.id);
  assert.ok(typeof firstNode.val === 'number');
  assert.ok(typeof firstNode.isFlagged === 'boolean');
  assert.ok(firstNode.color);

  // Check subgraph centered on customer
  const subGraph = await networkGraphEngine.buildGraph('CUST-1001', 20);
  assert.ok(subGraph.nodes.length > 0);
});

test('Innovation Module: Adaptive Threshold Engine recalibrates and records snapshot', async () => {
  const initialMetrics = await adaptiveThresholdEngine.evaluateMetrics(100);
  assert.ok(initialMetrics.precision >= 0 && initialMetrics.precision <= 1);
  assert.ok(initialMetrics.recall >= 0 && initialMetrics.recall <= 1);
  assert.ok(initialMetrics.f1 >= 0 && initialMetrics.f1 <= 1);
  assert.ok(initialMetrics.thresholds.high);

  const { snapshot, metrics } = await adaptiveThresholdEngine.recalibrate(null);
  assert.ok(snapshot);
  assert.ok(snapshot._id);
  assert.ok(typeof snapshot.f1 === 'number');
});

test('Innovation Module: Narrative Engine Dual-State Fallback Test (Key Unset vs Set)', async () => {
  const testData = {
    factors: [
      { factor: 'Amount Anomaly', plainText: 'Payment of ₹15,000 is 15x normal' },
      { factor: 'Device Novelty', plainText: 'Initiated from unrecognized device' }
    ],
    customer: { name: 'Aarav Patel' },
    amount: 15000,
    riskScore: 85
  };

  // 1. Test with AI_API_KEY unset (Clean Fallback)
  narrativeEngine.apiKey = null;
  const fallbackResult = await narrativeEngine.generateNarrative(testData);
  assert.strictEqual(fallbackResult, null, 'Narrative should return null gracefully without throwing when key is unset');

  const healthUnset = await narrativeEngine.checkHealth();
  assert.strictEqual(healthUnset.enabled, false);

  // 2. Test with mock key / fallback handling (Never throws on error)
  narrativeEngine.apiKey = 'mock_dev_key_for_test';
  const mockResult = await narrativeEngine.generateNarrative(testData);
  // Network or invalid key should be caught cleanly and return null without crashing
  assert.ok(mockResult === null || typeof mockResult === 'string');
});

test('Innovation Module: Centralized Audit Logging', async () => {
  const uniqueId = `TEST-ACTION-${Date.now()}`;
  const log = await logAuditEvent({
    actor: 'analyst1',
    action: 'TEST_INVESTIGATION_ACTION',
    entity: 'Alert',
    entityId: uniqueId,
    previousState: { status: 'Open' },
    newState: { status: 'Investigating' }
  });

  assert.ok(log);
  assert.strictEqual(log.entityId, uniqueId);

  const found = await AuditLog.findOne({ entityId: uniqueId });
  assert.ok(found);
  assert.strictEqual(found.action, 'TEST_INVESTIGATION_ACTION');
});
