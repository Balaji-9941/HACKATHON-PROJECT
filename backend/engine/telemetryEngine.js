/**
 * Telemetry Engine (Unified Hybrid Multi-Tier Architecture)
 * Executes synchronously in <20ms to provide continuous deterministic & ML-aligned risk scoring.
 */

const { computeAnomalyScore } = require('./anomalyDetector');
const { generateExplanation } = require('./explanationEngine');

/**
 * Checks if a given timestamp hour is within the customer's typical active window
 */
const isOutsideTypicalHours = (typicalHours, date) => {
  if (!typicalHours || typeof typicalHours !== 'string') return false;
  const match = typicalHours.match(/^(\d{1,2}):\d{2}-(\d{1,2}):\d{2}$/);
  if (!match) return false;

  const startHour = parseInt(match[1], 10);
  const endHour = parseInt(match[2], 10);
  const currentHour = new Date(date).getHours();

  if (startHour <= endHour) {
    return currentHour < startHour || currentHour > endHour;
  } else {
    return currentHour < startHour && currentHour > endHour;
  }
};

/**
 * Evaluates the 10 unified signals for a transaction against customer and merchant baselines
 */
const evaluateTier1 = (txnInput, customer = {}, merchant = null, recentCustomerTxns = []) => {
  const startHrTime = process.hrtime.bigint();

  const amount = Number(txnInput.amount) || 0;
  const avg = Number(customer.avgTransaction) || 500;
  const std = Number(customer.stdTransaction) || 150;
  const balance = Number(customer.balance) || 10000;
  const timestamp = txnInput.timestamp ? new Date(txnInput.timestamp) : new Date();

  // 1. Amount Anomaly (0-20)
  let amountAnomaly = 0;
  if (std > 0) {
    const diff = Math.abs(amount - avg);
    amountAnomaly = Math.min(20, Math.round((diff / std) * 5));
  } else {
    amountAnomaly = Math.min(20, Math.round((amount / Math.max(1, avg)) * 4));
  }

  // 2. Velocity Burst (0-20)
  const cutoffTime = new Date(timestamp.getTime() - 120000);
  const recentCount = Array.isArray(recentCustomerTxns)
    ? recentCustomerTxns.filter(t => new Date(t.timestamp) >= cutoffTime).length
    : 0;
  const velocityBurst = Math.min(20, recentCount * 4);

  // 3. Device Novelty (0-15)
  const knownDevices = customer.knownDevices || [];
  const deviceId = txnInput.deviceId || '';
  const isKnownDevice = knownDevices.length === 0 || knownDevices.includes(deviceId);
  const deviceNovelty = isKnownDevice ? 0 : 15;

  // 4. Location Variance (0-15)
  const usualLoc = (customer.usualLocation || '').toLowerCase().trim();
  const currentLoc = (txnInput.location || '').toLowerCase().trim();
  const isUsualLoc = !usualLoc || !currentLoc || usualLoc === currentLoc || usualLoc.includes(currentLoc) || currentLoc.includes(usualLoc);
  const locationVariance = isUsualLoc ? 0 : 15;

  // 5. Temporal Deviation (0-10)
  const isOutside = isOutsideTypicalHours(customer.typicalHours, timestamp);
  const temporalDeviation = isOutside ? 10 : 0;

  // 6. Merchant Risk (0-10)
  let merchantRisk = 2;
  if (merchant && typeof merchant.riskTier === 'number') {
    merchantRisk = Math.min(10, Math.max(0, merchant.riskTier * 2));
  } else if (txnInput.merchantCategory) {
    const cat = txnInput.merchantCategory.toLowerCase();
    if (cat.includes('crypto') || cat.includes('gambling')) merchantRisk = 10;
    else if (cat.includes('loan') || cat.includes('gaming') || cat.includes('wire')) merchantRisk = 8;
    else if (cat.includes('entertainment')) merchantRisk = 4;
    else merchantRisk = 2;
  }

  // 7. Network Consistency (0-10)
  const netTier = customer.networkRiskTier || 1;
  const networkConsistency = Math.min(10, Math.max(0, netTier * 2));

  // 8. Account Drain Check (Full balance drain)
  const isAccountDrain = balance > 0 && amount >= (balance * 0.90) && amount > 5000;
  const accountDrainScore = isAccountDrain ? 20 : 0;

  // Composite Rule Score (0-100)
  const riskBreakdown = {
    amountAnomaly,
    velocityBurst,
    deviceNovelty,
    locationVariance,
    temporalDeviation,
    merchantRisk,
    networkConsistency,
    accountDrain: accountDrainScore
  };

  const ruleScore = Math.min(100, Math.max(0,
    amountAnomaly +
    velocityBurst +
    deviceNovelty +
    locationVariance +
    temporalDeviation +
    merchantRisk +
    networkConsistency +
    accountDrainScore
  ));

  // Unified 10-Dimensional Feature Vector matching retrained XGBoost model:
  const amountRatioNorm = Math.min(2.0, Math.log1p(avg > 0 ? amount / avg : 1.0) / 5.0);
  const velocityNorm = Math.min(1.0, recentCount / 10.0);
  const deviceNovelNorm = deviceNovelty > 0 ? 1.0 : 0.0;
  const locationVarNorm = locationVariance > 0 ? 1.0 : 0.0;
  const temporalNorm = temporalDeviation > 0 ? 1.0 : 0.0;
  const merchantRiskNorm = merchantRisk / 10.0;
  const networkRiskNorm = netTier > 2 ? 1.0 : 0.0;
  const accountDrainNorm = isAccountDrain ? 1.0 : 0.0;
  const ruleScoreNorm = ruleScore / 100.0;
  const txnTypeRiskNorm = (txnInput.merchantCategory?.toLowerCase().includes('wire') ||
                           txnInput.merchantCategory?.toLowerCase().includes('peer')) ? 1.0 : 0.0;

  const featureVector = [
    amountRatioNorm,
    velocityNorm,
    deviceNovelNorm,
    locationVarNorm,
    temporalNorm,
    merchantRiskNorm,
    networkRiskNorm,
    accountDrainNorm,
    ruleScoreNorm,
    txnTypeRiskNorm
  ];

  // Multivariate Anomaly Score (0-100)
  const anomalyScore = computeAnomalyScore(featureVector.slice(0, 7));

  // Unified Hybrid Score (Blends deterministic signals with statistical distance)
  const totalRiskScore = Math.min(100, Math.max(0, Math.round(0.7 * ruleScore + 0.3 * anomalyScore)));

  // Severity & Friction mapping per §6.2 contract
  let alertSeverity = 'none';
  let userFrictionLevel = 'none';

  if (totalRiskScore <= 30) {
    alertSeverity = 'none';
    userFrictionLevel = 'none';
  } else if (totalRiskScore <= 50) {
    alertSeverity = 'low';
    userFrictionLevel = 'banner';
  } else if (totalRiskScore <= 70) {
    alertSeverity = 'medium';
    userFrictionLevel = 'confirm';
  } else if (totalRiskScore <= 85) {
    alertSeverity = 'high';
    userFrictionLevel = 'stepup';
  } else {
    alertSeverity = 'critical';
    userFrictionLevel = 'stepup_alert';
  }

  // Generate plain-text explanation and waterfall factors
  const { fraudExplanation, explanationFactors } = generateExplanation(riskBreakdown, {
    amount,
    customer,
    location: txnInput.location,
    deviceName: txnInput.deviceName,
    timestamp
  });

  const endHrTime = process.hrtime.bigint();
  const latencyMs = Number((Number(endHrTime - startHrTime) / 1e6).toFixed(2));

  return {
    totalRiskScore,
    ruleScore,
    anomalyScore,
    riskBreakdown,
    anomalyFeatures: featureVector,
    fraudExplanation,
    explanationFactors,
    modelTier: 1,
    modelVersion: 'unified-xgboost-v3',
    alertSeverity,
    userFrictionLevel,
    latencyMs
  };
};

// JIT Warm-up to ensure sub-millisecond execution
try {
  evaluateTier1({ amount: 100 }, { avgTransaction: 100, stdTransaction: 20, balance: 5000 }, null, []);
} catch (e) {}

module.exports = {
  evaluateTier1,
  isOutsideTypicalHours
};
