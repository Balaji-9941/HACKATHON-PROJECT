const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const { triggerScenario, SCENARIO_TYPES } = require('../services/scenarioInjector');
const autoFlowEngine = require('../services/autoFlowEngine');
const mlClient = require('../engine/mlClient');
const Transaction = require('../models/Transaction');

test.before(async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect('mongodb://127.0.0.1:27017/paytelemetry');
  }
});

test.after(() => {
  autoFlowEngine.stop();
});

test('Scenario Injector - 5 scenarios produce expected severity bands and explanations', async () => {
  const scenarios = [
    { type: SCENARIO_TYPES.VELOCITY_BURST, minScore: 25 },
    { type: SCENARIO_TYPES.DEVICE_TAKEOVER, minScore: 50 },
    { type: SCENARIO_TYPES.IMPOSSIBLE_TRAVEL, minScore: 40 },
    { type: SCENARIO_TYPES.MULE_RING, minScore: 60 },
    { type: SCENARIO_TYPES.CARD_TESTING, minScore: 10 }
  ];

  for (const item of scenarios) {
    const txn = await triggerScenario(item.type, 'manual_injection', null);
    assert.ok(txn.transactionId.startsWith('TXN-SCENARIO-'));
    assert.strictEqual(txn.isSimulatedScenario, true);
    assert.strictEqual(txn.scenarioType, item.type);
    assert.strictEqual(txn.flowSource, 'manual_injection');
    assert.ok(txn.totalRiskScore >= item.minScore, `Scenario ${item.type} score was ${txn.totalRiskScore}, expected >= ${item.minScore}`);
    assert.ok(txn.riskBreakdown, `Risk breakdown must exist for ${item.type}`);
    assert.ok(txn.explanationFactors.length > 0, `Explanation factors must exist for ${item.type}`);
  }
});

test('AutoFlow Engine - Lifecycle, dynamic rate config, and mid-stream resilience', async () => {
  // 1. Initialize AutoFlow
  await autoFlowEngine.init(null);
  assert.strictEqual(autoFlowEngine.isRunning, true);

  // 2. Dynamic config change
  autoFlowEngine.setConfig({ ratePerSecond: 10 });
  assert.strictEqual(autoFlowEngine.ratePerSecond, 10);

  // 3. Pause
  autoFlowEngine.pause();
  assert.strictEqual(autoFlowEngine.isPaused, true);

  // 4. Resume
  autoFlowEngine.start();
  assert.strictEqual(autoFlowEngine.isPaused, false);
  assert.strictEqual(autoFlowEngine.isRunning, true);

  // 5. Let it process several ticks
  for (let i = 0; i < 15; i++) {
    await autoFlowEngine.tick();
  }

  const status = autoFlowEngine.getStatus();
  assert.ok(status.totalProcessed >= 15, `Expected >=15 processed, got ${status.totalProcessed}`);

  // 6. Inspect recent 10 auto-flow transactions
  const recentAutoTxns = await Transaction.find({
    flowSource: { $in: ['autoflow_replay', 'autoflow_scenario'] }
  }).sort({ timestamp: -1 }).limit(10);

  assert.ok(recentAutoTxns.length >= 5, 'Should have multiple auto-flow transactions stored');
  for (const txn of recentAutoTxns) {
    assert.ok(typeof txn.totalRiskScore === 'number');
    assert.ok(txn.riskBreakdown);
    assert.ok(typeof txn.riskBreakdown.amountAnomaly === 'number');
    assert.ok(typeof txn.riskBreakdown.merchantRisk === 'number');
    assert.strictEqual(txn.status, 'SETTLED');
  }

  // 7. Mid-Stream ML Failure Resilience Test
  // Force ML circuit open to simulate ML service failure
  mlClient.recordFailure('Simulated service crash');
  mlClient.recordFailure('Simulated service crash');
  mlClient.recordFailure('Simulated service crash');
  assert.strictEqual(mlClient.isCircuitOpen(), true);

  // Execute ticks while ML service is down
  for (let i = 0; i < 5; i++) {
    await autoFlowEngine.tick();
  }

  // Confirm auto-flow continued streaming uninterrupted with Tier 1
  const afterFailureTxn = await Transaction.findOne({ flowSource: 'autoflow_replay' }).sort({ timestamp: -1 });
  assert.ok(afterFailureTxn);
  assert.strictEqual(afterFailureTxn.modelTier, 1);
  assert.ok(typeof afterFailureTxn.totalRiskScore === 'number');

  // Stop AutoFlow
  autoFlowEngine.stop();
  assert.strictEqual(autoFlowEngine.isRunning, false);
});
