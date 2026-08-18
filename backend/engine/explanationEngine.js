/**
 * Explanation Engine
 * Generates accurate plain-text explanations and TreeSHAP waterfall factors for actual triggered anomalies only.
 */

const generateExplanation = (riskBreakdown = {}, context = {}) => {
  const { amount = 0, customer = {}, location = '', deviceName = '', timestamp = new Date() } = context;
  const factors = [];

  const avg = customer.avgTransaction || 500;
  const ratio = avg > 0 ? (amount / avg).toFixed(1) : '1';

  // 1. Amount Anomaly Factor (Triggered if amount is >= 3x baseline)
  if (amount >= (avg * 2.5) || (riskBreakdown.amountAnomaly && riskBreakdown.amountAnomaly > 5)) {
    factors.push({
      factor: 'Amount Anomaly',
      contribution: riskBreakdown.amountAnomaly || Math.min(35, Math.round((amount / avg) * 3)),
      plainText: `Payment of ₹${Number(amount).toLocaleString()} is ${ratio}× your average transaction (₹${avg.toLocaleString()}).`
    });
  }

  // 2. Velocity Burst Factor (Triggered ONLY if rapid transactions actually occurred)
  if (riskBreakdown.velocityBurst && riskBreakdown.velocityBurst >= 6) {
    factors.push({
      factor: 'Velocity Burst',
      contribution: riskBreakdown.velocityBurst,
      plainText: `Multiple rapid transactions detected in a short time window.`
    });
  }

  // 3. Device Novelty Factor (Triggered ONLY if device is unrecognized)
  if (riskBreakdown.deviceNovelty && riskBreakdown.deviceNovelty > 5) {
    factors.push({
      factor: 'Device Novelty',
      contribution: riskBreakdown.deviceNovelty,
      plainText: `Initiated from an unrecognized device (${deviceName || 'New hardware signature'}).`
    });
  }

  // 4. Location Variance Factor (Triggered ONLY if location deviates)
  if (riskBreakdown.locationVariance && riskBreakdown.locationVariance > 5) {
    factors.push({
      factor: 'Location Variance',
      contribution: riskBreakdown.locationVariance,
      plainText: `Transaction originated from ${location || 'unregistered location'}, divergent from your typical home area.`
    });
  }

  // 5. Temporal Deviation Factor (Triggered ONLY if outside typical active window)
  if (riskBreakdown.temporalDeviation && riskBreakdown.temporalDeviation > 5) {
    const txHour = new Date(timestamp).getHours();
    const timeStr = `${String(txHour).padStart(2, '0')}:${String(new Date(timestamp).getMinutes()).padStart(2, '0')}`;
    factors.push({
      factor: 'Temporal Deviation',
      contribution: riskBreakdown.temporalDeviation,
      plainText: `Initiated at ${timeStr} — outside your typical active window.`
    });
  }

  // 6. Merchant / Counterparty Risk (Triggered ONLY if merchant risk tier is elevated >= 4)
  if (riskBreakdown.merchantRisk && riskBreakdown.merchantRisk >= 6) {
    factors.push({
      factor: 'Merchant Category Risk',
      contribution: riskBreakdown.merchantRisk,
      plainText: `Recipient/Merchant counterparty carries an elevated risk classification.`
    });
  }

  // 7. Network Graph Anomaly (Triggered ONLY if network tier > 2)
  if (riskBreakdown.networkConsistency && riskBreakdown.networkConsistency >= 6) {
    factors.push({
      factor: 'Network Graph Anomaly',
      contribution: riskBreakdown.networkConsistency,
      plainText: `Network telemetry indicates proximity to flagged clusters.`
    });
  }

  // 8. Account Drain Factor
  if (riskBreakdown.accountDrain && riskBreakdown.accountDrain > 0) {
    factors.push({
      factor: 'Account Drain',
      contribution: riskBreakdown.accountDrain,
      plainText: `Outflow represents an unusually high proportion of available account balance.`
    });
  }

  // Construct summary
  let fraudExplanation = 'Transaction parameters are within normal baseline ranges.';
  if (factors.length > 0) {
    factors.sort((a, b) => b.contribution - a.contribution);
    const topFactors = factors.slice(0, 3).map(f => f.plainText);
    fraudExplanation = topFactors.join(' ');
  }

  return {
    fraudExplanation,
    explanationFactors: factors
  };
};

module.exports = {
  generateExplanation
};
