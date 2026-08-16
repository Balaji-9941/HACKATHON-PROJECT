const express = require('express');
const router = express.Router();
const { triggerScenario, SCENARIO_TYPES } = require('../services/scenarioInjector');
const autoFlowEngine = require('../services/autoFlowEngine');
const replayEngine = require('../services/replayEngine');

// GET /api/simulator/scenarios
router.get('/scenarios', (req, res) => {
  res.json({
    scenarios: [
      { id: SCENARIO_TYPES.VELOCITY_BURST, name: 'Velocity Burst', description: 'Rapid flurry of transactions in <30s from same account' },
      { id: SCENARIO_TYPES.DEVICE_TAKEOVER, name: 'Device Takeover', description: 'High value transfer from completely novel unrecognized hardware' },
      { id: SCENARIO_TYPES.IMPOSSIBLE_TRAVEL, name: 'Impossible Travel', description: 'Geographic jump 6,000km away during 3:00 AM off-hours' },
      { id: SCENARIO_TYPES.MULE_RING, name: 'Mule Ring Funnel', description: 'Money funneling through high-risk mule cluster into crypto desk' },
      { id: SCENARIO_TYPES.CARD_TESTING, name: 'Card Testing Micro-Txn', description: 'Rapid micro-amount probing across merchant gateways' }
    ]
  });
});

// POST /api/simulator/trigger
router.post('/trigger', async (req, res) => {
  try {
    const { scenarioType } = req.body;
    if (!scenarioType || !Object.values(SCENARIO_TYPES).includes(scenarioType)) {
      return res.status(400).json({ error: `Invalid scenarioType. Allowed: ${Object.values(SCENARIO_TYPES).join(', ')}` });
    }

    const io = req.app.get('io');
    const transaction = await triggerScenario(scenarioType, 'manual_injection', io);
    res.json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/simulator/autoflow/start
router.post('/autoflow/start', (req, res) => {
  autoFlowEngine.start();
  res.json({ success: true, status: autoFlowEngine.getStatus() });
});

// POST /api/simulator/autoflow/pause
router.post('/autoflow/pause', (req, res) => {
  autoFlowEngine.pause();
  res.json({ success: true, status: autoFlowEngine.getStatus() });
});

// POST /api/simulator/autoflow/stop
router.post('/autoflow/stop', (req, res) => {
  autoFlowEngine.stop();
  res.json({ success: true, status: autoFlowEngine.getStatus() });
});

// PUT /api/simulator/autoflow/config
router.put('/autoflow/config', (req, res) => {
  const { ratePerSecond, mix } = req.body;
  autoFlowEngine.setConfig({ ratePerSecond, mix });
  res.json({ success: true, status: autoFlowEngine.getStatus() });
});

// GET /api/simulator/autoflow/status
router.get('/autoflow/status', (req, res) => {
  res.json(autoFlowEngine.getStatus());
});

// POST /api/simulator/replay/speed
router.post('/replay/speed', (req, res) => {
  const { multiplier } = req.body;
  const speed = replayEngine.setSpeed(multiplier);
  res.json({ success: true, speedMultiplier: speed });
});

module.exports = router;
