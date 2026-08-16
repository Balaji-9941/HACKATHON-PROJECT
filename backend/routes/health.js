const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const mlClient = require('../engine/mlClient');
const narrativeEngine = require('../engine/narrativeEngine');
const Customer = require('../models/Customer');

// GET /api/health
router.get('/', async (req, res) => {
  try {
    const mongoConnected = mongoose.connection.readyState === 1;

    // Check ML service
    const mlHealth = await mlClient.checkHealth();

    // Check LLM narrative
    const aiHealth = await narrativeEngine.checkHealth();

    // Check data source from customer records
    const sampleCustomer = await Customer.findOne().select('dataSource');
    const dataSource = sampleCustomer?.dataSource || 'offline-sample';

    const status = mongoConnected ? 'ok' : 'degraded';

    res.json({
      status,
      timestamp: new Date().toISOString(),
      mongodb: {
        connected: mongoConnected,
        state: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
      },
      mlService: mlHealth,
      aiNarrative: aiHealth,
      dataSource
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

module.exports = router;
