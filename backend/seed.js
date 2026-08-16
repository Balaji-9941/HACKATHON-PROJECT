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

const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to DB. Clearing existing collections...');

    await Promise.all([
      Customer.deleteMany({}),
      Transaction.deleteMany({}),
      Alert.deleteMany({}),
      Investigator.deleteMany({}),
      Merchant.deleteMany({}),
      ModelPerformanceSnapshot.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    // 1. Seed 10 Realistic Merchants
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

    // 2. Seed 3 Investigators
    const passwordHash = await bcrypt.hash('password123', 10);
    const investigators = [
      { username: 'analyst1', passwordHash, role: 'analyst', name: 'Priya Sharma (Analyst)', assignedAlerts: [] },
      { username: 'senior1', passwordHash, role: 'senior', name: 'Vikram Mehta (Senior Lead)', assignedAlerts: [] },
      { username: 'admin1', passwordHash, role: 'admin', name: 'Ananya Rao (SOC Admin)', assignedAlerts: [] }
    ];
    await Investigator.insertMany(investigators);
    console.log(`[Seed] Seeded ${investigators.length} investigators.`);

    // 3. Seed Primary Demo Customer and Secondary Customers
    const customers = [
      {
        customerId: 'CUST-1001',
        name: 'Aarav Patel',
        upiId: 'aarav.patel@okaxis',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        balance: 75450,
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
        dataSource: 'demo',
        networkRiskTier: 1
      },
      {
        customerId: 'CUST-1002',
        name: 'Rohan Verma',
        upiId: 'rohan.v@okhdfcbank',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
        balance: 32000,
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
        dataSource: 'demo',
        networkRiskTier: 1
      },
      {
        customerId: 'CUST-1003',
        name: 'Sneha Kapoor',
        upiId: 'sneha.k@okicici',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
        balance: 112000,
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
        dataSource: 'demo',
        networkRiskTier: 1
      },
      {
        customerId: 'CUST-9901',
        name: 'Mule Node Charlie',
        upiId: 'node.charlie@unknownpay',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        balance: 4500,
        avgTransaction: 250,
        stdTransaction: 80,
        usualLocation: 'Kolkata, IN',
        knownDevices: ['dev-unregistered-99'],
        accountAgeDays: 14,
        typicalHours: '01:00-06:00',
        totalTransactions: 42,
        savedContacts: [],
        securityScore: 35,
        dataSource: 'demo',
        networkRiskTier: 4
      }
    ];
    await Customer.insertMany(customers);
    console.log(`[Seed] Seeded ${customers.length} demo customers.`);

    // 4. Seed Initial Baseline Transactions for Aarav
    const sampleTxns = [
      {
        transactionId: 'TXN-INIT-001',
        customerId: 'CUST-1001',
        amount: 320,
        recipientUpiId: 'swiggy@icici',
        recipientName: 'Swiggy Food Delivery',
        merchantCategory: 'food_dining',
        location: 'Bangalore, IN',
        deviceId: 'dev-pixel-8',
        deviceName: 'Pixel-8-Pro',
        timestamp: new Date(Date.now() - 3600000 * 24),
        note: 'Dinner order',
        status: 'SETTLED',
        dataSource: 'demo',
        flowSource: 'consumer',
        totalRiskScore: 12,
        riskBreakdown: {
          amountAnomaly: 0,
          velocityBurst: 0,
          deviceNovelty: 0,
          locationVariance: 0,
          temporalDeviation: 0,
          merchantRisk: 10,
          networkConsistency: 2
        },
        fraudExplanation: 'Normal transaction matching customer baseline and device profile.',
        explanationFactors: [
          { factor: 'Merchant Profile', contribution: 10, plainText: 'Verified merchant with standard rating.' },
          { factor: 'Baseline Match', contribution: 2, plainText: 'Amount and location consistent with historical behavior.' }
        ],
        modelTier: 1,
        alertSeverity: 'none',
        userFrictionLevel: 'none',
        latencyMs: 14,
        groundTruthLabel: 0
      },
      {
        transactionId: 'TXN-INIT-002',
        customerId: 'CUST-1001',
        amount: 750,
        recipientUpiId: 'rohan.v@okhdfcbank',
        recipientName: 'Rohan Verma',
        merchantCategory: 'peer_to_peer',
        location: 'Bangalore, IN',
        deviceId: 'dev-pixel-8',
        deviceName: 'Pixel-8-Pro',
        timestamp: new Date(Date.now() - 3600000 * 12),
        note: 'Movie tickets split',
        status: 'SETTLED',
        dataSource: 'demo',
        flowSource: 'consumer',
        totalRiskScore: 18,
        riskBreakdown: {
          amountAnomaly: 3,
          velocityBurst: 0,
          deviceNovelty: 0,
          locationVariance: 0,
          temporalDeviation: 0,
          merchantRisk: 5,
          networkConsistency: 5
        },
        fraudExplanation: 'Peer-to-peer transfer to frequent contact within usual transaction range.',
        explanationFactors: [
          { factor: 'Known Contact', contribution: 5, plainText: 'Recipient is in frequent saved contacts list.' },
          { factor: 'Amount Range', contribution: 3, plainText: 'Amount within 1 standard deviation of customer mean.' }
        ],
        modelTier: 1,
        alertSeverity: 'none',
        userFrictionLevel: 'none',
        latencyMs: 12,
        groundTruthLabel: 0
      },
      {
        transactionId: 'TXN-INIT-003',
        customerId: 'CUST-1001',
        amount: 38500,
        recipientUpiId: 'p2pdesk@cryptopay',
        recipientName: 'CryptoExchange P2P Desk',
        merchantCategory: 'crypto_virtual',
        location: 'Moscow, RU',
        deviceId: 'dev-unknown-771',
        deviceName: 'Generic Android Device',
        timestamp: new Date(Date.now() - 3600000 * 2),
        note: 'Urgent transfer',
        status: 'SETTLED',
        dataSource: 'demo',
        flowSource: 'manual_injection',
        totalRiskScore: 92,
        riskBreakdown: {
          amountAnomaly: 20,
          velocityBurst: 8,
          deviceNovelty: 15,
          locationVariance: 15,
          temporalDeviation: 10,
          merchantRisk: 10,
          networkConsistency: 8
        },
        fraudExplanation: 'Amount is 59× usual mean, from unknown device in Moscow at 03:30 AM to high-risk merchant.',
        explanationFactors: [
          { factor: 'Amount Deviation', contribution: 20, plainText: 'Amount INR 38,500 exceeds 5x customer standard deviation.' },
          { factor: 'Location Anomaly', contribution: 15, plainText: 'New location (Moscow, RU) 6,000km from usual location.' },
          { factor: 'Device Novelty', contribution: 15, plainText: 'Unrecognized hardware signature (dev-unknown-771).' },
          { factor: 'Merchant Risk', contribution: 10, plainText: 'Category Crypto P2P flagged with Tier 5 risk profile.' },
          { factor: 'Temporal Variance', contribution: 10, plainText: 'Initiated outside registered active hours (08:00-23:00).' }
        ],
        modelTier: 1,
        alertSeverity: 'critical',
        userFrictionLevel: 'stepup_alert',
        latencyMs: 16,
        groundTruthLabel: 1
      }
    ];
    await Transaction.insertMany(sampleTxns);
    console.log(`[Seed] Seeded ${sampleTxns.length} sample transactions.`);

    // 5. Seed Alert for Critical Transaction
    const alert = {
      alertId: 'ALT-1001',
      transactionId: 'TXN-INIT-003',
      customerId: 'CUST-1001',
      customerName: 'Aarav Patel',
      severity: 'critical',
      status: 'Open',
      assignedTo: 'unassigned',
      fraudExplanation: 'Amount is 59× usual mean, from unknown device in Moscow at 03:30 AM to high-risk merchant.',
      createdAt: new Date(Date.now() - 3600000 * 2),
      riskScoreAtCreation: 92,
      linkedAlerts: []
    };
    await Alert.create(alert);
    console.log('[Seed] Seeded initial critical alert.');

    // 6. Seed Initial Model Performance Snapshot
    const snapshot = {
      timestamp: new Date(),
      precision: 0.942,
      recall: 0.915,
      f1: 0.928,
      thresholds: { low: 30, medium: 50, high: 70, critical: 85 },
      sampleSize: 3450,
      modelTier: 1
    };
    await ModelPerformanceSnapshot.create(snapshot);
    console.log('[Seed] Seeded initial ModelPerformanceSnapshot.');

    // 7. Seed Audit Log Entry
    const audit = {
      actor: 'System',
      action: 'SYSTEM_INITIALIZED',
      entity: 'Platform',
      entityId: 'SYSTEM-ROOT',
      previousState: null,
      newState: { status: 'INITIALIZED', initializedAt: new Date().toISOString(), seedVersion: '1.0' }
    };
    await AuditLog.create(audit);
    console.log('[Seed] Seeded initial AuditLog.');

    console.log('✅ [Seed Completed Successfully]');
    process.exit(0);
  } catch (error) {
    console.error('❌ [Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
