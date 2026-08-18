const Customer = require('../models/Customer');
const Merchant = require('../models/Merchant');
const Transaction = require('../models/Transaction');
const { evaluateMLTransaction } = require('../engine/telemetryEngine');
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
 * Triggers a real scenario against a genuine customer baseline using Pure ML scoring
 */
const triggerScenario = async (scenarioType, flowSource = 'manual_injection', io = null) => {
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
      const amount = Math.round(customer.avgTransaction * 1.5);
      recipientUpiId = 'amazonpay@apl';
      recipientName = 'Amazon India Retail';
      merchantCategory = 'ecommerce';

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
          dataSource: customer.dataSource || 'fraudshield_v2',
          flowSource,
          totalRiskScore: 35,
          riskBreakdown: { velocityBurst: i * 4 },
          fraudExplanation: 'Velocity burst test vector.',
          modelTier: 2,
          modelVersion: 'xgboost-ml-v3',
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
      const amount = Math.round(customer.avgTransaction * 4.2);
      recipientUpiId = 'royalwin@offshorepay';
      recipientName = 'Offshore Gaming & Casino';
      merchantCategory = 'gambling';
      merchantRiskTier = 5;

      const offsetDate = new Date(now);
      offsetDate.setHours(3, 15, 0, 0);

      txnInput = {
        amount,
        location: 'Moscow, RU',
        deviceId: 'dev-foreign-proxy-88',
        deviceName: 'Foreign Node',
        merchantCategory,
        timestamp: offsetDate
      };
      break;
    }

    case SCENARIO_TYPES.MULE_RING: {
      const amount = Math.min(customer.balance || 45000, 38000);
      recipientUpiId = 'p2pdesk@cryptopay';
      recipientName = 'CryptoExchange P2P Desk';
      merchantCategory = 'crypto_virtual';
      merchantRiskTier = 5;

      txnInput = {
        amount,
        location: 'Kolkata, IN',
        deviceId: 'dev-mule-aggregator-01',
        deviceName: 'Mule Terminal Cluster',
        merchantCategory,
        timestamp: now
      };
      break;
    }

    case SCENARIO_TYPES.CARD_TESTING: {
      const amount = 25;
      recipientUpiId = 'tataneu@hdfcbank';
      recipientName = 'Tata Neu SuperApp';
      merchantCategory = 'retail';
      merchantRiskTier = 1;

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

    default:
      throw new Error(`Unknown scenario type: ${scenarioType}`);
  }

  const cutoff = new Date(Date.now() - 120000);
  const recentTxns = await Transaction.find({
    customerId: customer.customerId,
    timestamp: { $gte: cutoff }
  }).select('timestamp');

  // Direct 100% Pure ML Evaluation
  const assessment = await evaluateMLTransaction(
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
    dataSource: customer.dataSource || 'fraudshield_v2',
    flowSource,
    isSimulatedScenario: true,
    scenarioType,

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

  return txnDoc;
};

module.exports = {
  triggerScenario,
  SCENARIO_TYPES
};
