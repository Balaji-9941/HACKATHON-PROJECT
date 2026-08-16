const axios = require('axios');
const { logAuditEvent } = require('../services/auditLogger');

class MLClient {
  constructor() {
    this.serviceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
    this.enabled = process.env.ML_SERVICE_ENABLED !== 'false';
    this.timeoutMs = 150;
    
    // Circuit breaker state
    this.circuitState = 'CLOSED'; // 'CLOSED', 'OPEN', 'HALF_OPEN'
    this.failureTimestamps = [];
    this.circuitOpenedAt = null;
    this.circuitResetTimeoutMs = 30000; // 30 seconds
    this.failureThreshold = 3;
    this.windowMs = 60000; // 60 seconds
  }

  isCircuitOpen() {
    if (!this.enabled) return true;

    const now = Date.now();
    if (this.circuitState === 'OPEN') {
      if (now - this.circuitOpenedAt > this.circuitResetTimeoutMs) {
        this.circuitState = 'HALF_OPEN';
        console.log('[ML CircuitBreaker] State transition: OPEN -> HALF_OPEN (probing ML service)');
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess() {
    if (this.circuitState === 'HALF_OPEN') {
      this.circuitState = 'CLOSED';
      this.failureTimestamps = [];
      this.circuitOpenedAt = null;
      console.log('[ML CircuitBreaker] State transition: HALF_OPEN -> CLOSED (recovered)');
    }
  }

  recordFailure(errorReason) {
    const now = Date.now();
    this.failureTimestamps.push(now);
    // Keep only timestamps within rolling 60s window
    this.failureTimestamps = this.failureTimestamps.filter(t => now - t <= this.windowMs);

    if (this.circuitState === 'HALF_OPEN' || this.failureTimestamps.length >= this.failureThreshold) {
      this.circuitState = 'OPEN';
      this.circuitOpenedAt = now;
      console.warn(`[ML CircuitBreaker] Circuit OPENED due to failures (${errorReason}). Fallback to Tier 1 for 30s.`);
      logAuditEvent({
        actor: 'MLCircuitBreaker',
        action: 'CIRCUIT_OPENED',
        entity: 'MLService',
        entityId: 'tier2-service',
        newState: { state: 'OPEN', reason: errorReason, openedAt: new Date(now).toISOString() }
      });
    }
  }

  /**
   * Predicts fraud probability from Python ML microservice with 150ms timeout
   * @param {Array<number>} features Feature vector
   * @returns {Promise<Object|null>} { probability, modelVersion } or null
   */
  async predict(features) {
    if (this.isCircuitOpen()) {
      return null;
    }

    try {
      const response = await axios.post(`${this.serviceUrl}/predict`, { features }, {
        timeout: this.timeoutMs,
        headers: { 'Content-Type': 'application/json' }
      });

      this.recordSuccess();
      return {
        probability: response.data.probability,
        modelVersion: response.data.modelVersion || 'xgboost-v1'
      };
    } catch (error) {
      this.recordFailure(error.message);
      return null;
    }
  }

  /**
   * Asynchronously fetches real SHAP values from Python ML service
   * @param {Array<number>} features Feature vector
   * @returns {Promise<Object|null>}
   */
  async explain(features) {
    if (this.isCircuitOpen()) {
      return null;
    }

    try {
      const response = await axios.post(`${this.serviceUrl}/explain`, { features }, {
        timeout: 500, // async explain can take slightly longer
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data.shapValues || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Health check for ML microservice
   */
  async checkHealth() {
    if (!this.enabled) {
      return { enabled: false, healthy: false, state: 'DISABLED', modelVersion: null };
    }

    try {
      const response = await axios.get(`${this.serviceUrl}/health`, { timeout: 800 });
      return {
        enabled: true,
        healthy: response.data.status === 'ok',
        state: this.circuitState,
        modelVersion: response.data.modelVersion || 'xgboost-v1'
      };
    } catch (error) {
      return {
        enabled: true,
        healthy: false,
        state: this.circuitState,
        modelVersion: null,
        error: error.message
      };
    }
  }
}

module.exports = new MLClient();
