const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const Merchant = require('../models/Merchant');
const { evaluateMLTransaction } = require('../engine/telemetryEngine');
const mlClient = require('../engine/mlClient');
const narrativeEngine = require('../engine/narrativeEngine');
const { handleTransactionAlert } = require('../services/alertManager');
const { logAuditEvent } = require('../services/auditLogger');

// POST /api/transactions/pre-check (Pure ML Evaluation in <25ms)
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

    const assessment = await evaluateMLTransaction(
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

// POST /api/transactions/confirm (Pure ML Settlement & Double-Entry Balance Update)
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

    // Fetch recent transactions in past 120s
    const cutoff = new Date(Date.now() - 120000);
    const recentTxns = await Transaction.find({
      customerId,
      timestamp: { $gte: cutoff }
    }).select('timestamp');

    // 1. Direct Pure ML Evaluation
    const assessment = await evaluateMLTransaction(
      { amount, location, deviceId, deviceName, merchantCategory, timestamp: new Date() },
      customer,
      merchant,
      recentTxns
    );

    // 2. Settle transaction immediately (Financial balance deduction for Sender)
    const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + (assessment.totalRiskScore * 9))}`;
    
    // Debit sender customer balance
    customer.balance = Math.max(0, customer.balance - amount);
    customer.totalTransactions = (customer.totalTransactions || 0) + 1;
    await customer.save();

    // Credit recipient customer balance if recipient is an internal customer account
    if (recipientUpiId) {
      const recipientCustomer = await Customer.findOne({
        upiId: { $regex: new RegExp(`^${recipientUpiId.trim()}$`, 'i') }
      });
      if (recipientCustomer) {
        recipientCustomer.balance = (recipientCustomer.balance || 0) + amount;
        recipientCustomer.totalTransactions = (recipientCustomer.totalTransactions || 0) + 1;
        await recipientCustomer.save();
      }
    }

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

      modelTier: 2,
      mlProbability: assessment.mlProbability,
      shapValues: assessment.shapValues,
      modelVersion: assessment.modelVersion || 'balanced-xgboost-v4',
      alertSeverity: assessment.alertSeverity,
      userFrictionLevel: assessment.userFrictionLevel,
      latencyMs: assessment.latencyMs,
      groundTruthLabel: assessment.totalRiskScore >= 70 ? 1 : 0,
      userAcknowledgedAt: userAcknowledgedAt ? new Date(userAcknowledgedAt) : null
    });

    await transactionDoc.save();

    // 3. Auto Alert Creation if high/critical ML risk
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
        mlProbability: assessment.mlProbability,
        riskScore: assessment.totalRiskScore,
        severity: assessment.alertSeverity,
        friction: assessment.userFrictionLevel
      }
    });

    const diff = process.hrtime(reqStart);
    const endToEndLatencyMs = Number((diff[0] * 1000 + diff[1] / 1e6).toFixed(2));

    // Respond immediately to consumer / caller
    return res.json({
      success: true,
      transaction: transactionDoc,
      endToEndLatencyMs
    });
  } catch (error) {
    console.error('[Confirm Error]:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/transactions (Query with filtering & pagination - shows outgoing & incoming for customer)
router.get('/', async (req, res) => {
  try {
    const { customerId, severity, status, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (customerId) {
      const currentCust = await Customer.findOne({ customerId });
      if (currentCust && currentCust.upiId) {
        filter.$or = [
          { customerId },
          { recipientUpiId: currentCust.upiId }
        ];
      } else {
        filter.customerId = customerId;
      }
    }

    if (severity && severity !== 'ALL') filter.alertSeverity = severity.toLowerCase();
    if (status) filter.status = status;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const transactions = await Transaction.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await Transaction.countDocuments(filter);

    res.json({
      transactions,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/transactions/:id (Single transaction detail with SHAP attributions)
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
