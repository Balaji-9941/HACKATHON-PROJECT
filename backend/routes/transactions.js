const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const Merchant = require('../models/Merchant');
const { evaluateTier1 } = require('../engine/telemetryEngine');
const mlClient = require('../engine/mlClient');
const narrativeEngine = require('../engine/narrativeEngine');
const { handleTransactionAlert } = require('../services/alertManager');
const { logAuditEvent } = require('../services/auditLogger');

// POST /api/transactions/pre-check (<20ms synchronous Tier 1 evaluation)
router.post('/pre-check', async (req, res) => {
  const reqStart = process.hrtime();
  try {
    const { customerId, amount, recipientUpiId, recipientName, location, deviceId, deviceName, merchantCategory } = req.body;

    if (!customerId || amount === undefined || amount <= 0) {
      return res.status(400).json({ error: 'Valid customerId and positive amount are required' });
    }

    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Fetch merchant if applicable
    const merchant = await Merchant.findOne({ upiId: recipientUpiId });

    // Fetch recent transactions in past 120s for velocity calculation
    const cutoff = new Date(Date.now() - 120000);
    const recentTxns = await Transaction.find({
      customerId,
      timestamp: { $gte: cutoff }
    }).select('timestamp');

    const assessment = evaluateTier1(
      { amount, location, deviceId, deviceName, merchantCategory, timestamp: new Date() },
      customer,
      merchant,
      recentTxns
    );

    const diff = process.hrtime(reqStart);
    const serverLatencyMs = Number((diff[0] * 1000 + diff[1] / 1e6).toFixed(2));

    return res.json({
      success: true,
      riskAssessment: {
        ...assessment,
        serverLatencyMs
      }
    });
  } catch (error) {
    console.error('[PreCheck Error]:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/transactions/confirm (<200ms settlement and async ML enhancement)
router.post('/confirm', async (req, res) => {
  const reqStart = process.hrtime();
  try {
    const {
      customerId,
      amount,
      recipientUpiId,
      recipientName,
      location = 'Bangalore, IN',
      deviceId = 'dev-pixel-8',
      deviceName = 'Pixel-8-Pro',
      merchantCategory = 'peer_to_peer',
      note = '',
      flowSource = 'consumer',
      scenarioType = null,
      isSimulatedScenario = false,
      userAcknowledgedAt = null
    } = req.body;

    if (!customerId || amount === undefined || amount <= 0) {
      return res.status(400).json({ error: 'Valid customerId and positive amount are required' });
    }

    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const merchant = await Merchant.findOne({ upiId: recipientUpiId });

    const cutoff = new Date(Date.now() - 120000);
    const recentTxns = await Transaction.find({
      customerId,
      timestamp: { $gte: cutoff }
    }).select('timestamp');

    // 1. Synchronous Tier 1 Evaluation
    const assessment = evaluateTier1(
      { amount, location, deviceId, deviceName, merchantCategory, timestamp: new Date() },
      customer,
      merchant,
      recentTxns
    );

    // 2. Settle transaction immediately (Financial settlement is non-blocking)
    const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + (assessment.totalRiskScore * 9))}`;
    
    // Debit customer balance
    customer.balance = Math.max(0, customer.balance - amount);
    customer.totalTransactions = (customer.totalTransactions || 0) + 1;
    await customer.save();

    const transactionDoc = new Transaction({
      transactionId,
      customerId,
      amount,
      recipientUpiId,
      recipientName: recipientName || recipientUpiId,
      merchantCategory,
      location,
      deviceId,
      deviceName,
      timestamp: new Date(),
      note,
      status: 'SETTLED',
      dataSource: customer.dataSource || 'live',
      flowSource,
      isSimulatedScenario: Boolean(isSimulatedScenario || scenarioType),
      scenarioType,

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
      groundTruthLabel: assessment.totalRiskScore >= 70 ? 1 : 0,
      userAcknowledgedAt: userAcknowledgedAt ? new Date(userAcknowledgedAt) : null
    });

    await transactionDoc.save();

    // 3. Auto Alert Creation if high/critical
    const io = req.app.get('io');
    await handleTransactionAlert(transactionDoc, customer, io);

    // 4. Broadcast live transaction via Socket.io
    if (io) {
      io.emit('admin:new_transaction', transactionDoc);
    }

    await logAuditEvent({
      actor: customerId,
      action: 'TRANSACTION_SETTLED',
      entity: 'Transaction',
      entityId: transactionId,
      newState: {
        amount,
        riskScore: assessment.totalRiskScore,
        severity: assessment.alertSeverity,
        friction: assessment.userFrictionLevel
      }
    });

    const diff = process.hrtime(reqStart);
    const endToEndLatencyMs = Number((diff[0] * 1000 + diff[1] / 1e6).toFixed(2));

    // Respond immediately to consumer / caller
    res.json({
      success: true,
      transaction: transactionDoc,
      endToEndLatencyMs
    });

    // 5. Asynchronous Non-Blocking Tier 2 ML Scoring & Narrative Enrichment
    setImmediate(async () => {
      try {
        if (!mlClient.isCircuitOpen()) {
          const mlResult = await mlClient.predict(assessment.anomalyFeatures);
          if (mlResult && typeof mlResult.probability === 'number') {
            const blendedScore = Math.round(0.5 * assessment.totalRiskScore + 0.5 * (mlResult.probability * 100));
            const shapValues = await mlClient.explain(assessment.anomalyFeatures);

            transactionDoc.modelTier = 2;
            transactionDoc.mlProbability = mlResult.probability;
            transactionDoc.modelVersion = mlResult.modelVersion;
            transactionDoc.totalRiskScore = blendedScore;
            if (shapValues) {
              transactionDoc.shapValues = shapValues;
            }

            // Optional LLM Narrative
            const narrative = await narrativeEngine.generateNarrative({
              factors: assessment.explanationFactors,
              customer,
              amount,
              location,
              deviceName,
              riskScore: blendedScore
            });
            if (narrative) {
              transactionDoc.aiNarrative = narrative;
            }

            await transactionDoc.save();

            if (io) {
              io.emit('admin:tier2_update', {
                transactionId: transactionDoc.transactionId,
                modelTier: 2,
                totalRiskScore: blendedScore,
                mlProbability: mlResult.probability,
                shapValues: transactionDoc.shapValues,
                modelVersion: mlResult.modelVersion,
                aiNarrative: transactionDoc.aiNarrative
              });
            }
          }
        }
      } catch (asyncErr) {
        // Non-blocking catch
        console.error('[Async ML Background Error]:', asyncErr.message);
      }
    });

  } catch (error) {
    console.error('[Confirm Error]:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/transactions
router.get('/', async (req, res) => {
  try {
    const { customerId, flowSource, severity, limit = 50, skip = 0 } = req.query;
    let query = {};
    if (customerId) query.customerId = customerId;
    if (flowSource) query.flowSource = flowSource;
    if (severity) query.alertSeverity = severity;

    const transactions = await Transaction.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .skip(Number(skip));

    const total = await Transaction.countDocuments(query);

    res.json({ transactions, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/transactions/:id
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ transactionId: req.params.id });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
