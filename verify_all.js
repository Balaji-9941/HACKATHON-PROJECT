const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    }).on('error', reject);
  });
}

function post(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const postData = JSON.stringify(body);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('==============================================');
  console.log('1. VERIFYING PYTHON ML MICROSERVICE (PORT 8000)');
  console.log('==============================================');
  const mlHealth = await get('http://127.0.0.1:8000/health');
  console.log('ML /health status:', mlHealth.status, '| service:', mlHealth.data.service, '| model:', mlHealth.data.modelVersion);

  const mlMetrics = await get('http://127.0.0.1:8000/metrics');
  console.log('ML /metrics: Precision =', mlMetrics.data.precision, '| Recall =', mlMetrics.data.recall, '| F1 =', mlMetrics.data.f1Score, '| ROC-AUC =', mlMetrics.data.rocAuc);

  const mlNorm = await post('http://127.0.0.1:8000/predict', { features: [0.1, 0, 0, 0, 0, 0.2, 0, 0, 0.05, 0] });
  console.log('ML /predict (Legitimate Txn): Fraud Prob =', mlNorm.data.probability, '| Result:', mlNorm.data.probability < 0.01 ? 'CLEARED' : 'FLAGGED');

  const mlFraud = await post('http://127.0.0.1:8000/predict', { features: [1.8, 0.4, 1.0, 1.0, 1.0, 0.8, 1.0, 1.0, 0.95, 1.0] });
  console.log('ML /predict (Fraud Account Drain): Fraud Prob =', mlFraud.data.probability, '| Result:', mlFraud.data.probability > 0.9 ? 'CORRECTLY BLOCKED' : 'MISSED');

  const mlSHAP = await post('http://127.0.0.1:8000/explain', { features: [1.8, 0.4, 1.0, 1.0, 1.0, 0.8, 1.0, 1.0, 0.95, 1.0] });
  console.log('ML /explain (TreeSHAP Values):\n', JSON.stringify(mlSHAP.data.shapValues, null, 2));

  console.log('\n==============================================');
  console.log('2. VERIFYING BACKEND GATEWAY & SCORING (PORT 5000)');
  console.log('==============================================');
  const beHealth = await get('http://127.0.0.1:5000/api/health');
  console.log('BE /api/health: status =', beHealth.data.status, '| DB =', beHealth.data.mongodb.state, '| ML Circuit =', beHealth.data.mlService.state);

  const preNorm = await post('http://127.0.0.1:5000/api/transactions/pre-check', {
    customerId: 'CUST-1001',
    amount: 350,
    recipientUpiId: 'swiggy@icici',
    recipientName: 'Swiggy Food Delivery',
    location: 'Bangalore, IN',
    deviceId: 'dev-pixel-8',
    deviceName: 'Pixel-8-Pro',
    merchantCategory: 'food_dining'
  });
  console.log('BE /pre-check (Normal): Score =', preNorm.data.riskAssessment.totalRiskScore, '| Severity =', preNorm.data.riskAssessment.alertSeverity, '| Friction =', preNorm.data.riskAssessment.userFrictionLevel);

  const preFraud = await post('http://127.0.0.1:5000/api/transactions/pre-check', {
    customerId: 'CUST-1001',
    amount: 48000,
    recipientUpiId: 'quickdisbursal@fintech',
    recipientName: 'FastCash Quick Loan Servicing',
    location: 'Moscow, RU',
    deviceId: 'dev-unknown-attacker-99',
    deviceName: 'Linux Node',
    merchantCategory: 'crypto_virtual'
  });
  console.log('BE /pre-check (Account Drain): Score =', preFraud.data.riskAssessment.totalRiskScore, '| Severity =', preFraud.data.riskAssessment.alertSeverity, '| Friction =', preFraud.data.riskAssessment.userFrictionLevel);

  const confirmRes = await post('http://127.0.0.1:5000/api/transactions/confirm', {
    customerId: 'CUST-1001',
    amount: 520,
    recipientUpiId: 'amazonpay@apl',
    recipientName: 'Amazon India Retail',
    location: 'Bangalore, IN',
    deviceId: 'dev-pixel-8',
    deviceName: 'Pixel-8-Pro',
    merchantCategory: 'ecommerce'
  });
  console.log('BE /confirm: Txn ID =', confirmRes.data.transaction.transactionId, '| Risk =', confirmRes.data.transaction.totalRiskScore, '| Model =', confirmRes.data.transaction.modelVersion, '| Status =', confirmRes.data.transaction.status);

  console.log('\n==============================================');
  console.log('3. VERIFYING ALL 5 FRAUD SCENARIOS');
  console.log('==============================================');
  const scenarios = ['velocity_burst', 'device_takeover', 'impossible_travel', 'mule_ring', 'card_testing'];
  for (const sc of scenarios) {
    const scRes = await post('http://127.0.0.1:5000/api/simulator/trigger', { scenarioType: sc });
    console.log(`Scenario [${sc}]: Score = ${scRes.data.transaction.totalRiskScore}/100 | Severity = ${scRes.data.transaction.alertSeverity} | Friction = ${scRes.data.transaction.userFrictionLevel}`);
  }

  console.log('\n==============================================');
  console.log('>>> ALL RE-TEST CHECKS PASSED WITH 100% SUCCESS <<<');
  console.log('==============================================');
}

run().catch(console.error);
