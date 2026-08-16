const fs = require('fs');
const path = require('path');

const generateBundledSample = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

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
      networkRiskTier: 1
    },
    {
      customerId: 'CUST-1002',
      name: 'Rohan Verma',
      upiId: 'rohan.v@okhdfcbank',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
      balance: 32000,
      avgTransaction: 420,
      stdTransaction: 110,
      usualLocation: 'Bangalore, IN',
      knownDevices: ['dev-iphone-15'],
      accountAgeDays: 310,
      typicalHours: '09:00-22:00',
      totalTransactions: 86,
      savedContacts: [
        { name: 'Aarav Patel', upiId: 'aarav.patel@okaxis', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80', category: 'friend', frequency: 18 }
      ],
      securityScore: 88,
      networkRiskTier: 1
    },
    {
      customerId: 'CUST-1003',
      name: 'Sneha Kapoor',
      upiId: 'sneha.k@okicici',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      balance: 112000,
      avgTransaction: 1250,
      stdTransaction: 380,
      usualLocation: 'Mumbai, IN',
      knownDevices: ['dev-galaxy-s24'],
      accountAgeDays: 600,
      typicalHours: '07:00-23:30',
      totalTransactions: 312,
      savedContacts: [
        { name: 'Aarav Patel', upiId: 'aarav.patel@okaxis', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80', category: 'family', frequency: 24 }
      ],
      securityScore: 95,
      networkRiskTier: 1
    },
    {
      customerId: 'CUST-1004',
      name: 'Vikram Malhotra',
      upiId: 'vikram.m@paytm',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      balance: 89000,
      avgTransaction: 850,
      stdTransaction: 240,
      usualLocation: 'Delhi, IN',
      knownDevices: ['dev-oneplus-12'],
      accountAgeDays: 510,
      typicalHours: '08:30-22:30',
      totalTransactions: 215,
      savedContacts: [],
      securityScore: 90,
      networkRiskTier: 1
    },
    {
      customerId: 'CUST-1005',
      name: 'Ananya Deshmukh',
      upiId: 'ananya.d@okhdfcbank',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
      balance: 64000,
      avgTransaction: 520,
      stdTransaction: 160,
      usualLocation: 'Pune, IN',
      knownDevices: ['dev-pixel-7a'],
      accountAgeDays: 390,
      typicalHours: '08:00-21:30',
      totalTransactions: 160,
      savedContacts: [],
      securityScore: 91,
      networkRiskTier: 1
    },
    {
      customerId: 'CUST-9901',
      name: 'Mule Ring Primary Node Alpha',
      upiId: 'mule.alpha@cryptonet',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      balance: 5400,
      avgTransaction: 300,
      stdTransaction: 90,
      usualLocation: 'Kolkata, IN',
      knownDevices: ['dev-burner-phone-1'],
      accountAgeDays: 18,
      typicalHours: '00:00-05:00',
      totalTransactions: 65,
      savedContacts: [],
      securityScore: 32,
      networkRiskTier: 5
    }
  ];

  const merchants = [
    { upiId: 'swiggy@icici', name: 'Swiggy Food Delivery', category: 'food_dining', tier: 1 },
    { upiId: 'zomato@hdfcbank', name: 'Zomato Dining & Delivery', category: 'food_dining', tier: 1 },
    { upiId: 'amazonpay@apl', name: 'Amazon India Retail', category: 'ecommerce', tier: 1 },
    { upiId: 'flipkart@axisbank', name: 'Flipkart Online Store', category: 'ecommerce', tier: 1 },
    { upiId: 'uber@icici', name: 'Uber Rides India', category: 'transport', tier: 1 },
    { upiId: 'bookmyshow@yesbank', name: 'BookMyShow Entertainment', category: 'entertainment', tier: 2 },
    { upiId: 'p2pdesk@cryptopay', name: 'CryptoExchange P2P Desk', category: 'crypto_virtual', tier: 5 },
    { upiId: 'royalwin@offshorepay', name: 'Offshore Gaming & Casino', category: 'gambling', tier: 5 }
  ];

  const transactions = [];
  const baseTime = Date.now() - 3600000 * 24 * 10; // past 10 days

  // Generate 250 realistic transactions distributed across customers
  let txnIndex = 1;
  customers.forEach((cust) => {
    const count = cust.customerId === 'CUST-1001' ? 60 : (cust.customerId.startsWith('CUST-99') ? 40 : 35);
    for (let i = 0; i < count; i++) {
      const isMule = cust.customerId.startsWith('CUST-99');
      let isFraud = 0;
      if (isMule && i % 2 === 0) isFraud = 1;
      else if (i % 7 === 0) isFraud = 1;

      const merch = merchants[i % merchants.length];
      
      // Varied feature triggers
      const hasNovelDevice = isFraud && (i % 3 === 0);
      const hasNovelLoc = isFraud && (i % 2 === 0);
      const hasOffHours = isFraud && (i % 4 === 0);
      const hasHighVelocity = isFraud && (i % 5 === 0);

      const multiplier = isFraud ? (3.5 + (i % 5) * 1.5) : (0.7 + ((i % 6) * 0.15));
      const amount = Math.round(cust.avgTransaction * multiplier);
      const timestamp = new Date(baseTime + (txnIndex * 3600000 * 0.9));

      const location = hasNovelLoc ? 'Dubai, AE' : cust.usualLocation;
      const deviceId = hasNovelDevice ? `dev-unknown-${txnIndex}` : cust.knownDevices[0];
      const deviceName = hasNovelDevice ? 'Linux VM' : 'Primary Smartphone';

      const amountAnom = Math.min(20, Math.round((Math.abs(amount - cust.avgTransaction) / cust.stdTransaction) * 4));
      const velBurst = hasHighVelocity ? 16 : 0;
      const devNov = hasNovelDevice ? 15 : 0;
      const locVar = hasNovelLoc ? 15 : 0;
      const tempDev = hasOffHours ? 10 : 0;
      const merchRisk = merch.tier * 2;
      const netCons = isMule ? 8 : 2;

      const rawRuleScore = amountAnom + velBurst + devNov + locVar + tempDev + merchRisk + netCons;
      const riskScore = Math.min(100, Math.max(10, Math.round(isFraud ? Math.max(72, rawRuleScore) : Math.min(35, rawRuleScore))));
      const severity = riskScore > 85 ? 'critical' : (riskScore > 70 ? 'high' : (riskScore > 50 ? 'medium' : (riskScore > 30 ? 'low' : 'none')));
      const friction = severity === 'critical' ? 'stepup_alert' : (severity === 'high' ? 'stepup' : (severity === 'medium' ? 'confirm' : (severity === 'low' ? 'banner' : 'none')));

      transactions.push({
        transactionId: `TXN-SAMPLE-${String(txnIndex).padStart(4, '0')}`,
        customerId: cust.customerId,
        amount,
        recipientUpiId: merch.upiId,
        recipientName: merch.name,
        merchantCategory: merch.category,
        location,
        deviceId,
        deviceName,
        timestamp,
        note: isFraud ? 'Flagged multi-signal pattern' : 'Routine verified purchase',
        status: 'SETTLED',
        dataSource: 'offline-sample',
        flowSource: isFraud ? 'autoflow_scenario' : 'autoflow_replay',
        totalRiskScore: riskScore,
        riskBreakdown: {
          amountAnomaly: amountAnom,
          velocityBurst: velBurst,
          deviceNovelty: devNov,
          locationVariance: locVar,
          temporalDeviation: tempDev,
          merchantRisk: merchRisk,
          networkConsistency: netCons
        },
        fraudExplanation: isFraud 
          ? `Elevated risk: amount is ${(amount / cust.avgTransaction).toFixed(1)}x mean with multi-factor anomaly signals.` 
          : 'Transaction parameters consistent with customer baseline history.',
        explanationFactors: [
          { factor: 'Amount Deviation', contribution: amountAnom, plainText: `Amount is INR ${amount.toLocaleString()}` },
          { factor: 'Merchant Rating', contribution: merchRisk, plainText: `Merchant ${merch.name} (Risk Tier ${merch.tier})` }
        ],
        modelTier: 1,
        alertSeverity: severity,
        userFrictionLevel: friction,
        latencyMs: 14,
        groundTruthLabel: isFraud
      });

      txnIndex++;
    }
  });

  const payload = { customers, transactions };
  fs.writeFileSync(path.join(dataDir, 'bundled_sample.json'), JSON.stringify(payload, null, 2), 'utf8');
  console.log(`[SampleGenerator] Generated ${customers.length} customer profiles and ${transactions.length} transactions at backend/data/bundled_sample.json.`);
  return payload;
};

module.exports = { generateBundledSample };

if (require.main === module) {
  generateBundledSample();
}
