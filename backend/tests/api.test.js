const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { io: ClientIO } = require('socket.io-client');
const mongoose = require('mongoose');
const { app, server } = require('../server');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');

let clientSocket;
let testPort = 5055;

test.before(async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect('mongodb://127.0.0.1:27017/paytelemetry');
  }

  await new Promise((resolve) => {
    server.listen(testPort, () => {
      resolve();
    });
  });

  clientSocket = ClientIO(`http://127.0.0.1:${testPort}`);
  await new Promise((resolve) => {
    clientSocket.on('connect', resolve);
  });

  // Warm up connection & indexes & JIT
  await Customer.findOne({ customerId: 'CUST-1001' });
  await fetch(`http://127.0.0.1:${testPort}/api/transactions/pre-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId: 'CUST-1001', amount: 100 })
  });
});

test.after(async () => {
  if (clientSocket) clientSocket.disconnect();
  const io = app.get('io');
  if (io) io.close();
  await new Promise((resolve) => server.close(resolve));
});

test('Integration: POST /api/transactions/pre-check responds with Tier 1 evaluation <20ms engine latency', async () => {
  const reqData = JSON.stringify({
    customerId: 'CUST-1001',
    amount: 600,
    recipientUpiId: 'amazonpay@apl',
    recipientName: 'Amazon India Retail',
    location: 'Bangalore, IN',
    deviceId: 'dev-pixel-8',
    deviceName: 'Pixel-8-Pro',
    merchantCategory: 'ecommerce'
  });

  const response = await fetch(`http://127.0.0.1:${testPort}/api/transactions/pre-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: reqData
  });

  assert.strictEqual(response.status, 200);
  const data = await response.json();
  assert.ok(data.success);
  assert.ok(typeof data.riskAssessment.totalRiskScore === 'number');
  assert.ok([1, 2].includes(data.riskAssessment.modelTier));
  assert.ok(data.riskAssessment.latencyMs < 50, `Engine latency must be <50ms, was ${data.riskAssessment.latencyMs}ms`);
});

test('Integration: POST /api/transactions/confirm responds <200ms and broadcasts admin:new_transaction via Socket.io', async () => {
  const reqData = JSON.stringify({
    customerId: 'CUST-1001',
    amount: 720,
    recipientUpiId: 'swiggy@icici',
    recipientName: 'Swiggy Food Delivery',
    location: 'Bangalore, IN',
    deviceId: 'dev-pixel-8',
    deviceName: 'Pixel-8-Pro',
    merchantCategory: 'food_dining',
    note: 'Lunch order'
  });

  // Setup socket listener
  const socketReceivedPromise = new Promise((resolve) => {
    clientSocket.once('admin:new_transaction', (txn) => {
      resolve(txn);
    });
  });

  const start = Date.now();
  const response = await fetch(`http://127.0.0.1:${testPort}/api/transactions/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: reqData
  });
  const latency = Date.now() - start;

  assert.strictEqual(response.status, 200);
  const data = await response.json();
  assert.ok(data.success);
  assert.ok(data.transaction.transactionId.startsWith('TXN-'));
  assert.strictEqual(data.transaction.status, 'SETTLED');
  assert.ok(latency < 200, `Confirm end-to-end latency must be <200ms, was ${latency}ms`);

  // Verify socket event was received
  const receivedTxn = await socketReceivedPromise;
  assert.strictEqual(receivedTxn.transactionId, data.transaction.transactionId);
  assert.strictEqual(receivedTxn.amount, 720);
});
