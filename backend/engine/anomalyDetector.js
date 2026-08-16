/**
 * Mahalanobis Distance Anomaly Detector
 * Computes multivariate statistical distance against population/customer feature vectors
 */

// Baseline feature means and standard deviations from training distribution
// [amountRatio, velocityBurst, deviceNovelty, locationNovelty, temporalNovelty, merchantRisk, networkRisk]
const BASELINE_MEANS = [1.0, 0.2, 0.05, 0.05, 0.05, 1.2, 1.1];
const BASELINE_STDS = [0.8, 0.5, 0.22, 0.22, 0.22, 0.8, 0.6];

/**
 * Computes normalized Mahalanobis / Euclidean z-distance across continuous features
 * @param {Array<number>} featureVector
 * @returns {number} Normalized score 0-100
 */
const computeAnomalyScore = (featureVector) => {
  if (!Array.isArray(featureVector) || featureVector.length === 0) {
    return 10;
  }

  let squaredDistanceSum = 0;
  const n = Math.min(featureVector.length, BASELINE_MEANS.length);

  for (let i = 0; i < n; i++) {
    const mean = BASELINE_MEANS[i];
    const std = BASELINE_STDS[i] || 1.0;
    const diff = (featureVector[i] - mean) / std;
    squaredDistanceSum += diff * diff;
  }

  // Mahalanobis distance D = sqrt(sum(z_i^2))
  const distance = Math.sqrt(squaredDistanceSum);

  // Chi-distribution mapping to 0-100 score
  // Typical distance in 7D space is ~sqrt(7) = 2.64. Anomaly > 5.0
  const normalizedScore = Math.min(100, Math.max(0, Math.round((distance / 6.0) * 100)));
  return normalizedScore;
};

module.exports = {
  computeAnomalyScore,
  BASELINE_MEANS,
  BASELINE_STDS
};
