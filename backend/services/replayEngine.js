const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const { evaluateTier1 } = require('../engine/telemetryEngine');
const { handleTransactionAlert } = require('./alertManager');

class ReplayEngine {
  constructor() {
    this.speedMultiplier = 10; // 1x - 500x
    this.isRunning = false;
    this.timer = null;
    this.replayIndex = 0;
  }

  setSpeed(multiplier) {
    this.speedMultiplier = Math.max(1, Math.min(500, Number(multiplier) || 10));
    console.log(`[ReplayEngine] Speed set to ${this.speedMultiplier}x`);
    return this.speedMultiplier;
  }

  async startReplay(io, ratePerSecond = 2) {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[ReplayEngine] Starting replay at ${this.speedMultiplier}x speed.`);

    const intervalMs = Math.max(50, Math.round(1000 / ratePerSecond));

    this.timer = setInterval(async () => {
      try {
        await this.replayNextStep(io);
      } catch (err) {
        console.error('[ReplayEngine Error]:', err.message);
      }
    }, intervalMs);
  }

  async replayNextStep(io) {
    // Fetch a sample customer
    const customers = await Customer.find().limit(10);
    if (!customers.length) return;

    const customer = customers[this.replayIndex % customers.length];
    this.replayIndex++;

    // Generate realistic amount within normal baseline
    const variance = (Math.sin(this.replayIndex * 0.7) * 0.5) * customer.stdTransaction;
    const amount = Math.max(50, Math.round(customer.avgTransaction + variance));

    const knownDev = customer.knownDevices[0] || 'dev-pixel-8';
    const txnInput = {
      amount,
      location: customer.usualLocation,
      deviceId: knownDev,
      deviceName: 'Pixel-8-Pro',
      merchantCategory: 'ecommerce',
      timestamp: new Date()
    };

    const assessment = evaluateTier1(txnInput, customer, { riskTier: 1 }, []);
    const transactionId = `TXN-REPLAY-${Date.now()}-${Math.floor(1000 + (assessment.totalRiskScore * 5))}`;

    const txnDoc = new Transaction({
      transactionId,
      customerId: customer.customerId,
      amount,
      recipientUpiId: 'amazonpay@apl',
      recipientName: 'Amazon India Retail',
      merchantCategory: 'ecommerce',
      location: customer.usualLocation,
      deviceId: knownDev,
      deviceName: 'Pixel-8-Pro',
      timestamp: new Date(),
      status: 'SETTLED',
      dataSource: customer.dataSource || 'offline-sample',
      flowSource: 'autoflow_replay',
      totalRiskScore: assessment.totalRiskScore,
      riskBreakdown: assessment.riskBreakdown,
      anomalyFeatures: assessment.anomalyFeatures,
      fraudExplanation: assessment.fraudExplanation,
      explanationFactors: assessment.explanationFactors,
      modelTier: 1,
      modelVersion: 'tier1-deterministic-v1',
      alertSeverity: assessment.alertSeverity,
      userFrictionLevel: assessment.userFrictionLevel,
      latencyMs: assessment.latencyMs,
      groundTruthLabel: 0
    });

    await txnDoc.save();

    if (io) {
      io.emit('admin:new_transaction', txnDoc);
    }
  }

  stopReplay() {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('[ReplayEngine] Replay stopped.');
  }
}

module.exports = new ReplayEngine();
