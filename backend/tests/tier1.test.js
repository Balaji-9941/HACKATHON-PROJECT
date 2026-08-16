const test = require('node:test');
const assert = require('node:assert');
const { evaluateTier1, isOutsideTypicalHours } = require('../engine/telemetryEngine');

test.before(async () => {
  // Warm up V8 JIT compilation for evaluateTier1
  for (let i = 0; i < 10; i++) {
    evaluateTier1({ amount: 100 }, { avgTransaction: 100, stdTransaction: 20 }, null, []);
  }
});

test('Tier 1 Telemetry Engine - Normal Transaction (<20ms, score <= 30)', () => {
  const customer = {
    customerId: 'CUST-1001',
    avgTransaction: 500,
    stdTransaction: 100,
    usualLocation: 'Bangalore, IN',
    knownDevices: ['dev-pixel-8'],
    typicalHours: '08:00-23:00',
    networkRiskTier: 1
  };

  const txn = {
    amount: 520,
    deviceId: 'dev-pixel-8',
    location: 'Bangalore, IN',
    timestamp: new Date('2026-08-16T12:00:00Z'),
    merchantCategory: 'food_dining'
  };

  // Warmup run
  evaluateTier1(txn, customer, { riskTier: 1 }, []);

  const result = evaluateTier1(txn, customer, { riskTier: 1 }, []);

  assert.ok(result.latencyMs < 20, `Latency must be <20ms, was ${result.latencyMs}ms`);
  assert.ok(result.totalRiskScore <= 30, `Score must be <= 30 for normal txn, was ${result.totalRiskScore}`);
  assert.strictEqual(result.alertSeverity, 'none');
  assert.strictEqual(result.userFrictionLevel, 'none');
  assert.strictEqual(result.modelTier, 1);
  assert.ok(result.riskBreakdown.amountAnomaly <= 2);
  assert.strictEqual(result.riskBreakdown.deviceNovelty, 0);
  assert.strictEqual(result.riskBreakdown.locationVariance, 0);
  assert.strictEqual(result.riskBreakdown.temporalDeviation, 0);
});

test('Tier 1 Telemetry Engine - High Risk Anomaly with Multi-Factor Trigger', () => {
  const customer = {
    customerId: 'CUST-1001',
    avgTransaction: 500,
    stdTransaction: 100,
    usualLocation: 'Bangalore, IN',
    knownDevices: ['dev-pixel-8'],
    typicalHours: '08:00-23:00',
    networkRiskTier: 1
  };

  // High amount, unknown device, foreign location, off-hours (03:00 AM), crypto merchant, mule network tier
  const customerMule = {
    ...customer,
    networkRiskTier: 5
  };

  const txn = {
    amount: 15000, // 145x std diff -> cap 20
    deviceId: 'dev-attacker-x', // novel -> 15
    location: 'Moscow, RU', // novel -> 15
    timestamp: new Date('2026-08-16T03:30:00+05:30'), // outside -> 10
    merchantCategory: 'crypto_virtual' // crypto -> 10
  };

  const recentTxns = [
    { timestamp: new Date() },
    { timestamp: new Date() }
  ];

  const result = evaluateTier1(txn, customerMule, { riskTier: 5 }, recentTxns);

  assert.ok(result.latencyMs < 20, `Latency must be <20ms, was ${result.latencyMs}ms`);
  assert.strictEqual(result.riskBreakdown.amountAnomaly, 20);
  assert.strictEqual(result.riskBreakdown.deviceNovelty, 15);
  assert.strictEqual(result.riskBreakdown.locationVariance, 15);
  assert.strictEqual(result.riskBreakdown.temporalDeviation, 10);
  assert.strictEqual(result.riskBreakdown.merchantRisk, 10);
  assert.strictEqual(result.riskBreakdown.velocityBurst, 8);
  assert.strictEqual(result.riskBreakdown.networkConsistency, 10);
  
  assert.ok(result.totalRiskScore >= 86, `Score should be critical (>=86), was ${result.totalRiskScore}`);
  assert.strictEqual(result.alertSeverity, 'critical');
  assert.strictEqual(result.userFrictionLevel, 'stepup_alert');
  assert.ok(result.explanationFactors.length >= 4, 'Should explain multiple anomalous factors');
  assert.ok(result.fraudExplanation.includes('Payment') || result.fraudExplanation.includes('unrecognized') || result.fraudExplanation.includes('Moscow'));
});

test('Tier 1 Telemetry Engine - Velocity Burst Calculation', () => {
  const customer = {
    customerId: 'CUST-1001',
    avgTransaction: 500,
    stdTransaction: 100,
    usualLocation: 'Bangalore, IN',
    knownDevices: ['dev-pixel-8'],
    typicalHours: '08:00-23:00',
    networkRiskTier: 1
  };

  const now = new Date();
  const recentTxns = [
    { timestamp: new Date(now.getTime() - 20000) },
    { timestamp: new Date(now.getTime() - 40000) },
    { timestamp: new Date(now.getTime() - 60000) }
  ];

  const txn = {
    amount: 500,
    deviceId: 'dev-pixel-8',
    location: 'Bangalore, IN',
    timestamp: now
  };

  const result = evaluateTier1(txn, customer, null, recentTxns);
  // 3 recent txns * 4 = 12
  assert.strictEqual(result.riskBreakdown.velocityBurst, 12);
});

test('Hour check function', () => {
  const insideDate = new Date('2026-08-16T14:00:00');
  const outsideDate = new Date('2026-08-16T03:00:00');
  assert.strictEqual(isOutsideTypicalHours('08:00-23:00', insideDate), false);
  assert.strictEqual(isOutsideTypicalHours('08:00-23:00', outsideDate), true);
});
