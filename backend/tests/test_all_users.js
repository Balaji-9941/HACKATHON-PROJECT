const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const { evaluateMLTransaction } = require('./engine/telemetryEngine');

async function testAllUsersScenarios() {
  await mongoose.connect('mongodb://127.0.0.1:27017/paytelemetry');
  const customers = await Customer.find();
  console.log(`Found ${customers.length} total customer accounts in database.\n`);

  const results = [];

  for (const c of customers) {
    const isConsumer = c.customerId.startsWith('CUST-');
    
    // Scenario 1: Normal benign transaction (e.g. 50% of avg transaction)
    const normalAmount = Math.max(50, Math.round(c.avgTransaction * 0.8));
    const normalEval = await evaluateMLTransaction({
      amount: normalAmount,
      location: c.usualLocation,
      deviceId: c.knownDevices?.[0] || 'dev-001',
      deviceName: 'Pixel-8-Pro',
      merchantCategory: 'food_dining',
      timestamp: new Date()
    }, c, null, []);

    // Scenario 2: Moderate deviation (e.g. 8x avg transaction)
    const modAmount = Math.round(c.avgTransaction * 8);
    const modEval = await evaluateMLTransaction({
      amount: modAmount,
      location: c.usualLocation,
      deviceId: c.knownDevices?.[0] || 'dev-001',
      deviceName: 'Pixel-8-Pro',
      merchantCategory: 'electronics',
      timestamp: new Date()
    }, c, null, []);

    // Scenario 3: High anomaly / Fraud spike (50x avg + new device + foreign location)
    const fraudAmount = Math.min(c.balance, Math.round(c.avgTransaction * 50));
    const fraudEval = await evaluateMLTransaction({
      amount: fraudAmount,
      location: 'Lagos, NG',
      deviceId: 'DEV-NEW-SUSPECT',
      deviceName: 'Rooted-Device',
      merchantCategory: 'crypto_investment',
      timestamp: new Date('2026-08-21T03:30:00Z') // 3:30 AM
    }, c, null, [
      { timestamp: new Date(Date.now() - 30000) },
      { timestamp: new Date(Date.now() - 60000) },
      { timestamp: new Date(Date.now() - 90000) }
    ]);

    results.push({
      customerId: c.customerId,
      name: c.name,
      avg: c.avgTransaction,
      balance: c.balance,
      isConsumer,
      normal: { amount: normalAmount, score: normalEval.totalRiskScore, severity: normalEval.alertSeverity },
      moderate: { amount: modAmount, score: modEval.totalRiskScore, severity: modEval.alertSeverity },
      fraud: { amount: fraudAmount, score: fraudEval.totalRiskScore, severity: fraudEval.alertSeverity }
    });
  }

  console.table(results.map(r => ({
    ID: r.customerId,
    Name: r.name,
    AvgTxn: r.avg,
    'Normal Score': `${r.normal.score} (${r.normal.severity})`,
    'Mod Score': `${r.moderate.score} (${r.moderate.severity})`,
    'Fraud Score': `${r.fraud.score} (${r.fraud.severity})`
  })));

  // Check for anomalies
  const failedNormal = results.filter(r => r.normal.score > 25);
  const failedFraud = results.filter(r => r.fraud.score < 70);

  console.log('\n=== DIAGNOSTIC SUMMARY ===');
  console.log(`Failed Normal Test Cases (False Positives): ${failedNormal.length}`);
  if (failedNormal.length > 0) console.log(failedNormal);

  console.log(`Failed Fraud Test Cases (False Negatives): ${failedFraud.length}`);
  if (failedFraud.length > 0) console.log(failedFraud);

  process.exit(0);
}

testAllUsersScenarios().catch(err => {
  console.error(err);
  process.exit(1);
});
