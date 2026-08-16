const test = require('node:test');
const assert = require('node:assert');
const mlClient = require('../engine/mlClient');

test('Tier 2 ML Service: Health, Predict, and Real SHAP Explainability', async () => {
  const health = await mlClient.checkHealth();
  assert.strictEqual(health.enabled, true);
  assert.strictEqual(health.healthy, true);
  assert.strictEqual(health.modelVersion, 'xgboost-v1');

  // Test predict endpoint with 7-feature vector
  const testFeatures = [3.5, 2.0, 1.0, 1.0, 0.0, 3.0, 2.0];
  const prediction = await mlClient.predict(testFeatures);

  assert.ok(prediction);
  assert.strictEqual(prediction.modelVersion, 'xgboost-v1');
  assert.ok(typeof prediction.probability === 'number');
  assert.ok(prediction.probability >= 0 && prediction.probability <= 1);

  // Test explain endpoint for genuine SHAP values
  const shap = await mlClient.explain(testFeatures);
  assert.ok(shap);
  assert.ok('amount_ratio' in shap);
  assert.ok('velocity_burst' in shap);
  assert.ok('device_novelty' in shap);
  assert.ok('merchant_risk' in shap);
  assert.ok(typeof shap.amount_ratio === 'number');
});

test('Tier 2 ML Service: Circuit Breaker State Transitions and Resilience', async () => {
  // Reset circuit to clean state
  mlClient.circuitState = 'CLOSED';
  mlClient.failureTimestamps = [];

  assert.strictEqual(mlClient.isCircuitOpen(), false);

  // Simulate 3 consecutive failures
  mlClient.recordFailure('Simulated connection timeout');
  mlClient.recordFailure('Simulated connection timeout');
  mlClient.recordFailure('Simulated connection timeout');

  assert.strictEqual(mlClient.circuitState, 'OPEN');
  assert.strictEqual(mlClient.isCircuitOpen(), true);

  // When circuit is OPEN, predict returns null immediately without attempting network call
  const fastFallback = await mlClient.predict([1, 0, 0, 0, 0, 1, 1]);
  assert.strictEqual(fastFallback, null);

  // Transition to HALF_OPEN after timeout
  mlClient.circuitOpenedAt = Date.now() - 35000; // 35s ago
  assert.strictEqual(mlClient.isCircuitOpen(), false);
  assert.strictEqual(mlClient.circuitState, 'HALF_OPEN');

  // Success resets to CLOSED
  mlClient.recordSuccess();
  assert.strictEqual(mlClient.circuitState, 'CLOSED');
});
