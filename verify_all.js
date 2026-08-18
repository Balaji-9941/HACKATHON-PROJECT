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
  console.log('1. VERIFYING ML SERVICE ON USER EXACT CASE');
  console.log('==============================================');
  const mlHealth = await get('http://127.0.0.1:8000/health');
  console.log('ML Service Health:', mlHealth.data);

  // User Case: Payment of 8,542 INR (13.1x baseline of 650 INR), velocity burst, elevated merchant risk
  const userCaseRes = await post('http://127.0.0.1:5000/api/transactions/pre-check', {
    customerId: 'CUST-1001',
    amount: 8542,
    recipientUpiId: 'quickdisbursal@fintech',
    recipientName: 'FastCash Quick Loan Servicing',
    location: 'Bangalore, IN',
    deviceId: 'dev-pixel-8',
    deviceName: 'Pixel-8-Pro',
    merchantCategory: 'financial_services'
  });

  console.log('\nUser Case Evaluation Result:');
  console.log('Amount:', 8542, '(13.1x baseline 650)');
  console.log('Risk Score:', userCaseRes.data.riskAssessment.totalRiskScore, '/ 100');
  console.log('Severity:', userCaseRes.data.riskAssessment.alertSeverity);
  console.log('Friction Level:', userCaseRes.data.riskAssessment.userFrictionLevel);
  console.log('Explanation:', userCaseRes.data.riskAssessment.fraudExplanation);
  console.log('Factors:', userCaseRes.data.riskAssessment.explanationFactors);

  console.log('\n==============================================');
  console.log('2. VERIFYING BENIGN NORMAL TRANSACTION');
  console.log('==============================================');
  const normalRes = await post('http://127.0.0.1:5000/api/transactions/pre-check', {
    customerId: 'CUST-1001',
    amount: 450,
    recipientUpiId: 'swiggy@icici',
    recipientName: 'Swiggy Food Delivery',
    location: 'Bangalore, IN',
    deviceId: 'dev-pixel-8',
    deviceName: 'Pixel-8-Pro',
    merchantCategory: 'food_dining'
  });
  console.log('Normal Case Risk Score:', normalRes.data.riskAssessment.totalRiskScore, '/ 100 | Severity:', normalRes.data.riskAssessment.alertSeverity, '| Friction:', normalRes.data.riskAssessment.userFrictionLevel);

  console.log('\n==============================================');
  console.log('3. VERIFYING CRITICAL ACCOUNT DRAIN');
  console.log('==============================================');
  const drainRes = await post('http://127.0.0.1:5000/api/transactions/pre-check', {
    customerId: 'CUST-1001',
    amount: 48000,
    recipientUpiId: 'quickdisbursal@fintech',
    recipientName: 'FastCash Quick Loan Servicing',
    location: 'Moscow, RU',
    deviceId: 'DEV-NEW-ATTACKER-99',
    deviceName: 'Linux Node',
    merchantCategory: 'crypto_virtual'
  });
  console.log('Drain Case Risk Score:', drainRes.data.riskAssessment.totalRiskScore, '/ 100 | Severity:', drainRes.data.riskAssessment.alertSeverity, '| Friction:', drainRes.data.riskAssessment.userFrictionLevel);
}

run().catch(console.error);
