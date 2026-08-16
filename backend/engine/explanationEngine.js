/**
 * Explanation Engine (Tier 1 - Always Available)
 * Generates human-readable natural language summaries and waterfall explanation factors
 */

/**
 * Builds waterfall breakdown factors and plain-text summary
 * @param {Object} riskBreakdown 7-factor breakdown
 * @param {Object} context Transaction and customer contextual metadata
 * @returns {Object} { fraudExplanation, explanationFactors }
 */
const generateExplanation = (riskBreakdown, context = {}) => {
  const { amount = 0, customer = {}, location = '', deviceName = '', timestamp = new Date() } = context;
  const factors = [];

  // 1. Amount factor
  if (riskBreakdown.amountAnomaly > 0) {
    const ratio = customer.avgTransaction ? (amount / customer.avgTransaction).toFixed(1) : '1';
    factors.push({
      factor: 'Amount Anomaly',
      contribution: riskBreakdown.amountAnomaly,
      plainText: `Payment of ₹${amount.toLocaleString()} is ${ratio}× your average transaction (₹${customer.avgTransaction || amount}).`
    });
  }

  // 2. Velocity factor
  if (riskBreakdown.velocityBurst > 0) {
    factors.push({
      factor: 'Velocity Burst',
      contribution: riskBreakdown.velocityBurst,
      plainText: `Multiple rapid transactions detected within a 2-minute window.`
    });
  }

  // 3. Device novelty
  if (riskBreakdown.deviceNovelty > 0) {
    factors.push({
      factor: 'Device Novelty',
      contribution: riskBreakdown.deviceNovelty,
      plainText: `Initiated from an unrecognized device (${deviceName || 'New hardware signature'}).`
    });
  }

  // 4. Location variance
  if (riskBreakdown.locationVariance > 0) {
    factors.push({
      factor: 'Location Variance',
      contribution: riskBreakdown.locationVariance,
      plainText: `Transaction originating from ${location || 'unregistered location'}, divergent from typical area (${customer.usualLocation || 'Home city'}).`
    });
  }

  // 5. Temporal deviation
  if (riskBreakdown.temporalDeviation > 0) {
    const txHour = new Date(timestamp).getHours();
    const timeStr = `${String(txHour).padStart(2, '0')}:${String(new Date(timestamp).getMinutes()).padStart(2, '0')}`;
    factors.push({
      factor: 'Temporal Deviation',
      contribution: riskBreakdown.temporalDeviation,
      plainText: `Transaction initiated at ${timeStr} — outside your typical active window (${customer.typicalHours || 'Daytime'}).`
    });
  }

  // 6. Merchant risk
  if (riskBreakdown.merchantRisk > 0) {
    factors.push({
      factor: 'Merchant Category Risk',
      contribution: riskBreakdown.merchantRisk,
      plainText: `Recipient/Merchant category carries elevated fraud risk profile.`
    });
  }

  // 7. Network consistency
  if (riskBreakdown.networkConsistency > 0) {
    factors.push({
      factor: 'Network Graph Anomaly',
      contribution: riskBreakdown.networkConsistency,
      plainText: `Graph topology signals potential cluster or mule account correlation.`
    });
  }

  // Construct plain-language composite summary
  let fraudExplanation = 'Transaction parameters are within normal customer baseline ranges.';
  if (factors.length > 0) {
    // Sort factors by contribution descending
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
