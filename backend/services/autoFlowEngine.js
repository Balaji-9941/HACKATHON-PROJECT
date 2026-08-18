const Customer = require('../models/Customer');
const Merchant = require('../models/Merchant');
const Transaction = require('../models/Transaction');
const { evaluateMLTransaction } = require('../engine/telemetryEngine');
const { triggerScenario, SCENARIO_TYPES } = require('./scenarioInjector');
const { handleTransactionAlert } = require('./alertManager');

class AutoFlowEngine {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.ratePerSecond = 2; // Default 2 txns/sec
    this.mix = {
      replay: 0.85,
      highVariance: 0.10,
      scenario: 0.05
    };
    this.totalProcessed = 0;
    this.latencies = [];
    this.timer = null;
    this.customerCache = [];
    this.merchantCache = [];
    this.customerIndex = 0;
  }

  async init(io) {
    this.io = io;
    try {
      this.customerCache = await Customer.find().limit(20);
      this.merchantCache = await Merchant.find().limit(10);
    } catch (e) {
      console.warn('[AutoFlowEngine] Failed to cache customers/merchants on init:', e.message);
    }

    if (process.env.AUTO_FLOW_ENABLED !== 'false') {
      this.start();
    }
  }

  start() {
    if (this.isRunning && !this.isPaused) return;

    this.isRunning = true;
    this.isPaused = false;
    console.log(`[AutoFlowEngine] Started pure ML background stream @ ${this.ratePerSecond} txns/sec.`);

    if (this.timer) clearInterval(this.timer);
    const intervalMs = Math.max(50, Math.round(1000 / this.ratePerSecond));

    this.timer = setInterval(() => {
      this.tick();
    }, intervalMs);

    this.broadcastStatus();
  }

  pause() {
    if (!this.isRunning) return;
    this.isPaused = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('[AutoFlowEngine] Paused background stream.');
    this.broadcastStatus();
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('[AutoFlowEngine] Stopped background stream.');
    this.broadcastStatus();
  }

  setConfig({ ratePerSecond, mix }) {
    if (ratePerSecond !== undefined) {
      this.ratePerSecond = Math.max(0.5, Math.min(20, Number(ratePerSecond) || 2));
    }
    if (mix && typeof mix === 'object') {
      this.mix = { ...this.mix, ...mix };
    }

    console.log(`[AutoFlowEngine] Configuration updated: rate=${this.ratePerSecond}/s`);
    if (this.isRunning && !this.isPaused) {
      this.start();
    }
    this.broadcastStatus();
  }

  getStatus() {
    const avgLatency = this.latencies.length > 0
      ? Number((this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length).toFixed(1))
      : 14.2;

    return {
      running: this.isRunning,
      paused: this.isPaused,
      ratePerSecond: this.ratePerSecond,
      totalProcessed: this.totalProcessed,
      avgLatencyMs: avgLatency,
      mix: this.mix
    };
  }

  broadcastStatus() {
    if (this.io) {
      this.io.emit('admin:autoflow_status', this.getStatus());
    }
  }

  async tick() {
    if (!this.isRunning || this.isPaused) return;

    try {
      if (!this.customerCache.length) {
        this.customerCache = await Customer.find().limit(20);
      }
      if (!this.merchantCache.length) {
        this.merchantCache = await Merchant.find().limit(10);
      }
      if (!this.customerCache.length || !this.merchantCache.length) {
        return;
      }

      this.totalProcessed++;
      const roll = (this.totalProcessed % 100) / 100.0;

      // 5% Scenarios
      if (roll >= 0.95) {
        const scenarioKeys = Object.values(SCENARIO_TYPES);
        const chosenScenario = scenarioKeys[this.totalProcessed % scenarioKeys.length];
        const txn = await triggerScenario(chosenScenario, 'autoflow_scenario', this.io);
        this.latencies.push(txn.latencyMs || 14);
        if (this.latencies.length > 200) this.latencies.shift();
        return;
      }

      // Customer selection
      const customer = this.customerCache[this.customerIndex % this.customerCache.length];
      const merchant = this.merchantCache[this.totalProcessed % this.merchantCache.length];
      this.customerIndex++;

      // 10% High Variance, 85% Standard Baseline Replay
      const isHighVariance = roll >= 0.85 && roll < 0.95;
      const multiplier = isHighVariance ? 2.8 : (0.8 + ((this.totalProcessed % 5) * 0.1));
      const amount = Math.max(20, Math.round(customer.avgTransaction * multiplier));

      const knownDev = customer.knownDevices[0] || 'dev-pixel-8';
      const txnInput = {
        amount,
        location: customer.usualLocation,
        deviceId: knownDev,
        deviceName: 'Pixel-8-Pro',
        merchantCategory: merchant.category || 'ecommerce',
        timestamp: new Date()
      };

      // 100% Pure ML Evaluation
      const assessment = await evaluateMLTransaction(txnInput, customer, merchant, []);
      this.latencies.push(assessment.latencyMs || 12);
      if (this.latencies.length > 200) this.latencies.shift();

      const transactionId = `TXN-ML-${Date.now()}-${Math.floor(1000 + (assessment.totalRiskScore * 3))}`;

      const txnDoc = new Transaction({
        transactionId,
        customerId: customer.customerId,
        amount,
        recipientUpiId: merchant.upiId,
        recipientName: merchant.name,
        merchantCategory: merchant.category || 'ecommerce',
        location: customer.usualLocation,
        deviceId: knownDev,
        deviceName: 'Pixel-8-Pro',
        timestamp: new Date(),
        status: 'SETTLED',
        dataSource: customer.dataSource || 'fraudshield_v2',
        flowSource: 'autoflow_replay',

        totalRiskScore: assessment.totalRiskScore,
        riskBreakdown: assessment.riskBreakdown,
        anomalyFeatures: assessment.anomalyFeatures,
        fraudExplanation: assessment.fraudExplanation,
        explanationFactors: assessment.explanationFactors,

        modelTier: 2,
        mlProbability: assessment.mlProbability,
        shapValues: assessment.shapValues,
        modelVersion: assessment.modelVersion || 'xgboost-ml-v3',
        alertSeverity: assessment.alertSeverity,
        userFrictionLevel: assessment.userFrictionLevel,
        latencyMs: assessment.latencyMs,
        groundTruthLabel: 0
      });

      await txnDoc.save();

      // Broadcast via Socket.io
      if (this.io) {
        this.io.emit('admin:new_transaction', txnDoc);
      }

      // Check alert
      await handleTransactionAlert(txnDoc, customer, this.io);

    } catch (tickErr) {
      console.error('[AutoFlowEngine Tick Error]:', tickErr.message);
    }
  }
}

module.exports = new AutoFlowEngine();
