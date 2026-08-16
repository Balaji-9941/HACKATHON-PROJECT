const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { logAuditEvent } = require('../services/auditLogger');

// GET /api/customers
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({ customerId: req.params.id });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/customers/:id
router.put('/:id', async (req, res) => {
  try {
    const prev = await Customer.findOne({ customerId: req.params.id });
    if (!prev) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const updated = await Customer.findOneAndUpdate(
      { customerId: req.params.id },
      { $set: req.body },
      { new: true }
    );

    await logAuditEvent({
      actor: 'System',
      action: 'CUSTOMER_UPDATED',
      entity: 'Customer',
      entityId: req.params.id,
      previousState: prev.toObject(),
      newState: updated.toObject()
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
