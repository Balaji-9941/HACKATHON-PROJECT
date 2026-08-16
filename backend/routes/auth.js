const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Investigator = require('../models/Investigator');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');
const { logAuditEvent } = require('../services/auditLogger');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const investigator = await Investigator.findOne({ username });
    if (!investigator) {
      return res.status(401).json({ error: 'Invalid investigator credentials' });
    }

    const isMatch = await bcrypt.compare(password, investigator.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid investigator credentials' });
    }

    const token = jwt.sign(
      { id: investigator._id, username: investigator.username, role: investigator.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await logAuditEvent({
      actor: investigator.username,
      action: 'INVESTIGATOR_LOGIN',
      entity: 'Investigator',
      entityId: investigator._id.toString(),
      newState: { role: investigator.role, loginTime: new Date().toISOString() }
    });

    res.json({
      token,
      user: {
        id: investigator._id,
        username: investigator.username,
        name: investigator.name,
        role: investigator.role,
        assignedAlerts: investigator.assignedAlerts
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
