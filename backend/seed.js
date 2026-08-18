const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');

const Customer = require('./models/Customer');
const Transaction = require('./models/Transaction');
const Alert = require('./models/Alert');
const Investigator = require('./models/Investigator');
const Merchant = require('./models/Merchant');
const ModelPerformanceSnapshot = require('./models/ModelPerformanceSnapshot');
const AuditLog = require('./models/AuditLog');

const CSV_PATH = path.resolve(__dirname, '../fraudshield_dataset_v2_scored.csv');

const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to MongoDB. Clearing existing collections...');

    await Promise.all([
      Customer.deleteMany({}),
      Transaction.deleteMany({}),
      Alert.deleteMany({}),
      Investigator.deleteMany({}),
      Merchant.deleteMany({}),
      ModelPerformanceSnapshot.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    // 1. Seed Verified Merchants
    const merchants = [
      { merchantId: 'MERCH-001', name: 'Swiggy Food Delivery', upiId: 'swiggy@icici', category: 'food_dining', logo: '🍔', riskTier: 1 },
      { merchantId: 'MERCH-002', name: 'Zomato Dining & Delivery', upiId: 'zomato@hdfcbank', category: 'food_dining', logo: '🍕', riskTier: 1 },
      { merchantId: 'MERCH-003', name: 'Amazon India Retail', upiId: 'amazonpay@apl', category: 'ecommerce', logo: '📦', riskTier: 1 },
      { merchantId: 'MERCH-004', name: 'Flipkart Online Store', upiId: 'flipkart@axisbank', category: 'ecommerce', logo: '🛍️', riskTier: 1 },
      { merchantId: 'MERCH-005', name: 'Uber Rides India', upiId: 'uber@icici', category: 'transport', logo: '🚗', riskTier: 1 },
      { merchantId: 'MERCH-006', name: 'BookMyShow Entertainment', upiId: 'bookmyshow@yesbank', category: 'entertainment', logo: '🎬', riskTier: 2 },
      { merchantId: 'MERCH-007', name: 'Tata Neu SuperApp', upiId: 'tataneu@hdfcbank', category: 'retail', logo: '🏬', riskTier: 1 },
      { merchantId: 'MERCH-008', name: 'CryptoExchange P2P Desk', upiId: 'p2pdesk@cryptopay', category: 'crypto_virtual', logo: '🪙', riskTier: 5 },
      { merchantId: 'MERCH-009', name: 'Offshore Gaming & Casino', upiId: 'royalwin@offshorepay', category: 'gambling', logo: '🎲', riskTier: 5 },
      { merchantId: 'MERCH-010', name: 'FastCash Quick Loan Servicing', upiId: 'quickdisbursal@fintech', category: 'financial_services', logo: '💸', riskTier: 4 }
    ];
    await Merchant.insertMany(merchants);
    console.log(`[Seed] Seeded ${merchants.length} merchants.`);

    // 2. Seed SOC Investigators
    const passwordHash = await bcrypt.hash('password123', 10);
    const investigators = [
      { username: 'analyst1', passwordHash, role: 'analyst', name: 'Priya Sharma (Analyst)', assignedAlerts: [] },
      { username: 'senior1', passwordHash, role: 'senior', name: 'Vikram Mehta (Senior Lead)', assignedAlerts: [] },
      { username: 'admin1', passwordHash, role: 'admin', name: 'Ananya Rao (SOC Admin)', assignedAlerts: [] }
    ];
    await Investigator.insertMany(investigators);
    console.log(`[Seed] Seeded ${investigators.length} investigators.`);

    // 3. Seed Primary Consumer Accounts with High Balances
    const primaryCustomers = [
      {
        customerId: 'CUST-1001',
        name: 'Aarav Patel',
        upiId: 'aarav.patel@okaxis',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        balance: 2500000, // ₹25,00,000 (25 Lakhs)
        avgTransaction: 650,
        stdTransaction: 200,
        usualLocation: 'Bangalore, IN',
        knownDevices: ['dev-pixel-8', 'dev-macbook-pro'],
        accountAgeDays: 420,
        typicalHours: '08:00-23:00',
        totalTransactions: 148,
        savedContacts: [
          { name: 'Rohan Verma', upiId: 'rohan.v@okhdfcbank', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80', category: 'friend', frequency: 18 },
          { name: 'Sneha Kapoor', upiId: 'sneha.k@okicici', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80', category: 'family', frequency: 24 },
          { name: 'Swiggy Food', upiId: 'swiggy@icici', avatar: '🍔', category: 'merchant', frequency: 35 },
          { name: 'Amazon Pay', upiId: 'amazonpay@apl', avatar: '📦', category: 'merchant', frequency: 12 }
        ],
        securityScore: 92,
        dataSource: 'fraudshield_v2',
        networkRiskTier: 1
      },
      {
        customerId: 'CUST-1002',
        name: 'Rohan Verma',
        upiId: 'rohan.v@okhdfcbank',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
        balance: 1500000, // ₹15,00,000 (15 Lakhs)
        avgTransaction: 400,
        stdTransaction: 120,
        usualLocation: 'Bangalore, IN',
        knownDevices: ['dev-iphone-15'],
        accountAgeDays: 310,
        typicalHours: '09:00-22:00',
        totalTransactions: 86,
        savedContacts: [
          { name: 'Aarav Patel', upiId: 'aarav.patel@okaxis', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80', category: 'friend', frequency: 18 }
        ],
        securityScore: 88,
        dataSource: 'fraudshield_v2',
        networkRiskTier: 1
      },
      {
        customerId: 'CUST-1003',
        name: 'Sneha Kapoor',
        upiId: 'sneha.k@okicici',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
        balance: 3500000, // ₹35,00,000 (35 Lakhs)
        avgTransaction: 1200,
        stdTransaction: 450,
        usualLocation: 'Mumbai, IN',
        knownDevices: ['dev-galaxy-s24'],
        accountAgeDays: 600,
        typicalHours: '07:00-23:30',
        totalTransactions: 312,
        savedContacts: [
          { name: 'Aarav Patel', upiId: 'aarav.patel@okaxis', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80', category: 'family', frequency: 24 }
        ],
        securityScore: 95,
        dataSource: 'fraudshield_v2',
        networkRiskTier: 1
      }
    ];

    // 4. Ingest sample records from fraudshield_dataset_v2_scored.csv
    const datasetTxns = [];
    const datasetAlerts = [];
    const extraCustomersMap = new Map();

    if (fs.existsSync(CSV_PATH)) {
      console.log(`[Seed] Ingesting authentic sample rows from ${CSV_PATH} with csv-parser...`);
      
      await new Promise((resolve, reject) => {
        let count = 0;
        fs.createReadStream(CSV_PATH)
          .pipe(csv())
          .on('data', (row) => {
            if (count >= 500) return;
            count++;

            const custId = row.customerId || `CUST-${count}`;
            const custName = `Account ${custId.slice(-5)}`;
            const amount = parseFloat(row.amount) || 500;
            const baseline = parseFloat(row.customerBaselineAmount) || amount;
            const isFraud = parseInt(row.isFraud, 10) || (String(row.isFraud).trim() === '1' ? 1 : 0);
            const ruleScore = parseInt(row.ruleScore, 10) || 0;
            const riskBand = (row.riskBand || 'LOW').toLowerCase();
            const alertSeverity = isFraud ? 'critical' : (riskBand === 'critical' ? 'critical' : riskBand === 'high' ? 'high' : riskBand === 'medium' ? 'medium' : 'none');
            const frictionLevel = alertSeverity === 'critical' ? 'stepup_alert' : alertSeverity === 'high' ? 'stepup' : alertSeverity === 'medium' ? 'confirm' : 'none';

            const txnId = `TXN-FS-${String(count).padStart(5, '0')}`;

            const explanationText = isFraud
              ? `Fraud pattern detected: Deviation from baseline INR ${baseline.toFixed(0)}, novel device ${row.deviceId}, distance ${row.distanceFromHomeKm || 0}km.`
              : 'Legitimate transaction within established customer telemetry bounds.';

            datasetTxns.push({
              transactionId: txnId,
              customerId: custId,
              amount: Math.round(amount * 100) / 100,
              recipientUpiId: row.merchantId ? `${row.merchantId}@okaxis` : 'recipient@upi',
              recipientName: row.merchantCategory ? `${row.merchantCategory} (${row.merchantId})` : row.merchantId,
              merchantCategory: row.merchantCategory || 'peer_to_peer',
              location: row.location || 'Bangalore, IN',
              deviceId: row.deviceId || 'DEV-86977',
              deviceName: row.deviceId?.includes('NEW') ? 'Unrecognized Mobile Client' : 'Registered Device',
              timestamp: new Date(Date.now() - (500 - count) * 36000),
              note: row.transactionType || 'Payment',
              status: 'SETTLED',
              dataSource: 'fraudshield_v2',
              flowSource: 'autoflow_replay',
              totalRiskScore: Math.min(100, Math.max(ruleScore, isFraud ? 88 : 12)),
              riskBreakdown: {
                amountAnomaly: Math.min(20, Math.round((parseFloat(row.amountToBaselineRatio) || 1) * 3)),
                velocityBurst: Math.min(20, Math.round((parseFloat(row.txnCountLast24h) || 1) * 4)),
                deviceNovelty: row.deviceId?.includes('DEV-NEW-') ? 15 : 0,
                locationVariance: (parseFloat(row.distanceFromHomeKm) || 0) > 100 ? 15 : 0,
                temporalDeviation: 5,
                merchantRisk: row.merchantCategory === 'Wire Transfer' ? 10 : 2,
                networkConsistency: row.linkedToFraudNetwork === 'True' ? 10 : 2
              },
              fraudExplanation: explanationText,
              explanationFactors: [
                { factor: 'Amount Ratio', contribution: Math.min(20, Math.round((parseFloat(row.amountToBaselineRatio) || 1) * 3)), plainText: `Ratio ${row.amountToBaselineRatio || 1}x of baseline.` },
                { factor: 'Device Signature', contribution: row.deviceId?.includes('DEV-NEW-') ? 15 : 0, plainText: row.deviceId?.includes('DEV-NEW-') ? 'Novel hardware key' : 'Known hardware key' }
              ],
              modelTier: 2,
              modelVersion: 'balanced-xgboost-v4',
              alertSeverity,
              userFrictionLevel: frictionLevel,
              latencyMs: 14,
              groundTruthLabel: isFraud
            });

            // Collect extra customer profiles with high balances
            if (!extraCustomersMap.has(custId) && extraCustomersMap.size < 40) {
              extraCustomersMap.set(custId, {
                customerId: custId,
                name: custName,
                upiId: `${custId.toLowerCase()}@okhdfc`,
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
                balance: 1000000 + Math.round((parseFloat(row.oldbalanceOrg) || 25000) * 10), // 10-30 Lakhs
                avgTransaction: Math.round(baseline) || 600,
                stdTransaction: Math.round(baseline * 0.3) || 180,
                usualLocation: row.location || 'Bangalore, IN',
                knownDevices: [row.deviceId || 'dev-pixel-8'],
                accountAgeDays: 365,
                typicalHours: '08:00-23:00',
                totalTransactions: 100,
                savedContacts: [],
                securityScore: 90,
                dataSource: 'fraudshield_v2',
                networkRiskTier: row.linkedToFraudNetwork === 'True' ? 4 : 1
              });
            }

            // Seed alerts for high risk / fraud items
            if (isFraud || alertSeverity === 'critical' || alertSeverity === 'high') {
              if (datasetAlerts.length < 30) {
                const alertStatus = datasetAlerts.length % 3 === 0 ? 'Investigating' : datasetAlerts.length % 3 === 1 ? 'Open' : 'Open';
                datasetAlerts.push({
                  alertId: `ALT-FS-${String(datasetAlerts.length + 1).padStart(4, '0')}`,
                  transactionId: txnId,
                  customerId: custId,
                  customerName: custName,
                  severity: alertSeverity,
                  assignedTo: datasetAlerts.length % 2 === 0 ? 'analyst1' : 'senior1',
                  status: alertStatus,
                  fraudExplanation: explanationText,
                  createdAt: new Date(Date.now() - (30 - datasetAlerts.length) * 180000),
                  riskScoreAtCreation: Math.min(100, Math.max(ruleScore, 85)),
                  linkedAlerts: []
                });
              }
            }
          })
          .on('end', resolve)
          .on('error', reject);
      });
    }

    const allCustomers = [...primaryCustomers, ...Array.from(extraCustomersMap.values())];
    await Customer.insertMany(allCustomers);
    console.log(`[Seed] Seeded ${allCustomers.length} customer profiles with upgraded balances.`);

    await Transaction.insertMany(datasetTxns);
    console.log(`[Seed] Seeded ${datasetTxns.length} transactions from fraudshield dataset.`);

    await Alert.insertMany(datasetAlerts);
    console.log(`[Seed] Seeded ${datasetAlerts.length} triage incident alerts.`);

    // 5. Seed Model Performance Snapshot
    const metricsPath = path.resolve(__dirname, '../ml-service/models/metrics.json');
    let mlMetrics = {
      precision: 1.0,
      recall: 0.9987,
      f1Score: 0.9993,
      rocAuc: 0.9998,
      confusionMatrix: { tn: 19462, fp: 0, fn: 4, tp: 3056 },
      featureImportances: {
        amount_ratio: 0.0466,
        velocity_burst: 0.0309,
        device_novelty: 0.2344,
        location_variance: 0.2496,
        temporal_deviation: 0.0221,
        merchant_risk: 0.0103,
        network_risk: 0.0028,
        account_drain: 0.1529,
        rule_score: 0.2088,
        txn_type_risk: 0.0415
      }
    };

    if (fs.existsSync(metricsPath)) {
      try {
        mlMetrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
      } catch (e) {}
    }

    await ModelPerformanceSnapshot.create({
      snapshotId: `SNAPSHOT-${Date.now()}`,
      precision: mlMetrics.precision || 1.0,
      recall: mlMetrics.recall || 0.9987,
      f1: mlMetrics.f1Score || mlMetrics.f1 || 0.9993,
      sampleSize: 22522,
      modelTier: 2
    });

    console.log('[Seed] Seeded ModelPerformanceSnapshot successfully.');
    console.log('🎉 [Seed] Database reset & seeding finished successfully.');
    process.exit(0);

  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
