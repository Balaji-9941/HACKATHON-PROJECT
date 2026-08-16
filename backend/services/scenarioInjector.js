const Customer = require('../models/Customer');
const Merchant = require('../models/Merchant');
const Transaction = require('../models/Transaction');
const { evaluateTier1 } = require('../engine/telemetryEngine');
const { handleTransactionAlert } = require('./alertManager');
const { logAuditEvent } = require('./auditLogger');
const mlClient = require('../engine/mlClient');

const SCENARIO_TYPES = {
  VELOCITY_BURST: 'velocity_burst',
  DEVICE_TAKEOVER: 'device_takeover',
  IMPOSSIBLE_TRAVEL: 'impossible_travel',
  MULE_RING: 'mule_ring',
  CARD_TESTING: 'card_testing'
};

/**
 * Triggers a real scenario against a genuine customer baseline
 * @param {string} scenarioType
 * @param {string} flowSource 'manual_injection' or 'autoflow_scenario'
 * @param {Object} io Socket.io instance
 * @returns {Promise<Object>} Created transaction
 */
const triggerScenario = async (scenarioType, flowSource = 'manual_injection', io = null) => {
  // Select customer Aarav Patel or default demo customer
  let customer = await Customer.findOne({ customerId: 'CUST-1001' });
  if (!customer) {
    customer = await Customer.findOne();
  }
  if (!customer) {
    throw new Error('No customer available for scenario injection');
  }

  let txnInput = {};
  let recipientUpiId = 'swiggy@icici';
  let recipientName = 'Swiggy Food Delivery';
  let merchantCategory = 'food_dining';
  let merchantRiskTier = 1;

  const now = new Date();

  switch (scenarioType) {
    case SCENARIO_TYPES.VELOCITY_BURST: {
      // 4 rapid transactions
      const amount = Math.round(customer.avgTransaction * 1.5);
      recipientUpiId = 'amazonpay@apl';
      recipientName = 'Amazon India Retail';
      merchantCategory = 'ecommerce';

      // Insert 3 prior rapid transactions in past 30 seconds
      for (let i = 1; i <= 3; i++) {
        const priorTime = new Date(now.getTime() - (i * 8000));
        await Transaction.create({
          transactionId: `TXN-BURST-${Date.now()}-${i}`,
          customerId: customer.customerId,
          amount: Math.round(customer.avgTransaction * 0.8),
          recipientUpiId,
          recipientName,
          merchantCategory,
          location: customer.usualLocation,
          deviceId: customer.knownDevices[0] || 'dev-pixel-8',
          deviceName: 'Pixel-8-Pro',
          timestamp: priorTime,
          status: 'SETTLED',
          dataSource: customer.dataSource || 'live',
          flowSource,
          totalRiskScore: 25,
          riskBreakdown: { velocityBurst: i * 4 },
          fraudExplanation: 'Velocity burst test vector.',
          modelTier: 1,
          alertSeverity: 'low',
          userFrictionLevel: 'banner'
        });
      }

      txnInput = {
        amount,
        location: customer.usualLocation,
        deviceId: customer.knownDevices[0] || 'dev-pixel-8',
        deviceName: 'Pixel-8-Pro',
        merchantCategory,
        timestamp: now
      };
      break;
    }

    case SCENARIO_TYPES.DEVICE_TAKEOVER: {
      // High amount from unrecognized device
      const amount = Math.round(customer.avgTransaction * 9.5);
      recipientUpiId = 'quickdisbursal@fintech';
      recipientName = 'FastCash Quick Loan Servicing';
      merchantCategory = 'financial_services';
      merchantRiskTier = 4;

      txnInput = {
        amount,
        location: customer.usualLocation,
        deviceId: 'dev-unrecognized-takeover-991',
        deviceName: 'Generic Linux Emulator',
        merchantCategory,
        timestamp: now
      };
      break;
    }

    case SCENARIO_TYPES.IMPOSSIBLE_TRAVEL: {
      // Foreign location + off-hours
      const amount = Math.round(customer.avgTransaction * 4.2);
      recipientUpiId = 'hotelres@travelpay';
      recipientName = 'Grand Resort Moscow',
      merchantCategory = 'travel';
      merchantRiskTier = 3;

      txnInput = {
        amount,
        location: 'Moscow, RU',
        deviceId: customer.knownDevices[0] || 'dev-pixel-8',
        deviceName: 'Pixel-8-Pro',
        merchantCategory,
        timestamp: new Date(now.setHours(3, 15, 0, 0))
      };
      break;
    }

    case SCENARIO_TYPES.MULE_RING: {
      // Mule cluster connection to Crypto P2P Desk
      const amount = Math.round(customer.avgTransaction * 18);
      recipientUpiId = 'p2pdesk@cryptopay';
      recipientName = 'CryptoExchange P2P Desk';
      merchantCategory = 'crypto_virtual';
      merchantRiskTier = 5;

      const muleCustomer = {
        ...customer.toObject(),
        networkRiskTier: 5
      };

      txnInput = {
        amount,
        location: 'Kolkata, IN',
        deviceId: 'dev-burner-mule-node',
        deviceName: 'Mule Terminal Alpha',
        merchantCategory,
        timestamp: now
      };

      customer = muleCustomer;
      break;
    }

    case SCENARIO_TYPES.CARD_TESTING:
    default: {
      // Card testing small probing amount
      const amount = 15;
      recipientUpiId = 'tataneu@hdfcbank';
      recipientName = 'Tata Neu SuperApp';
      merchantCategory = 'retail';
      merchantRiskTier = 1;

      txnInput = {
        amount,
        location: customer.usualLocation,
        deviceId: 'dev-probing-bot-01',
        deviceName: 'Automated Scripting Bot',
        merchantCategory,
        timestamp: now
      };
      break;
    }
  }

  // Fetch recent transactions for velocity calculation
  const cutoff = new Date(Date.now() - 120000);
  const recentTxns = await Transaction.find({
    customerId: customer.customerId,
    timestamp: { $gte: cutoff }
  }).select('timestamp');

  // Evaluate through Tier 1 Engine
  const assessment = evaluateTier1(
    txnInput,
    customer,
    { riskTier: merchantRiskTier },
    recentTxns
  );

  const transactionId = `TXN-SCENARIO-${Date.now()}-${Math.floor(1000 + (assessment.totalRiskScore * 7))}`;

  const txnDoc = new Transaction({
    transactionId,
    customerId: customer.customerId,
    amount: txnInput.amount,
    recipientUpiId,
    recipientName,
    merchantCategory,
    location: txnInput.location,
    deviceId: txnInput.deviceId,
    deviceName: txnInput.deviceName,
    timestamp: txnInput.timestamp || new Date(),
    status: 'SETTLED',
    dataSource: customer.dataSource || 'live',
    flowSource,
    isSimulatedScenario: true,
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
    groundTruthLabel: ['device_takeover', 'impossible_travel', 'mule_ring'].includes(scenarioType) ? 1 : 0
  });

  await txnDoc.save();

  // Create alert if high or critical
  await handleTransactionAlert(txnDoc, customer, io);

  if (io) {
    io.emit('admin:new_transaction', txnDoc);
  }

  await logAuditEvent({
    actor: 'ScenarioInjector',
    action: 'SCENARIO_INJECTED',
    entity: 'Transaction',
    entityId: transactionId,
    newState: {
      scenarioType,
      riskScore: assessment.totalRiskScore,
      severity: assessment.alertSeverity,
      flowSource
    }
  });

  // Async ML enrichment if circuit closed
  setImmediate(async () => {
    try {
      if (!mlClient.isCircuitOpen()) {
        const mlRes = await mlClient.predict(assessment.anomalyFeatures);
        if (mlRes && typeof mlRes.probability === 'number') {
          const blended = Math.round(0.5 * assessment.totalRiskScore + 0.5 * (mlRes.probability * 100));
          const shap = await mlClient.explain(assessment.anomalyFeatures);
          txnDoc.modelTier = 2;
          txnDoc.totalRiskScore = blended;
          txnDoc.mlProbability = mlRes.probability;
          txnDoc.modelVersion = mlRes.modelVersion;
          if (shap) txnDoc.shapValues = shap;
          await txnDoc.save();

          if (io) {
            io.emit('admin:tier2_update', {
              transactionId: txnDoc.transactionId,
              modelTier: 2,
              totalRiskScore: blended,
              mlProbability: mlRes.probability,
              shapValues: shap
            });
          }
        }
      }
    } catch (e) {}
  });

  return txnDoc;
};

module.exports = {
  SCENARIO_TYPES,
  triggerScenario
};
