const express = require('express');
const router = express.Router();
const Merchant = require('../models/Merchant');

// GET /api/merchants
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { upiId: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ]
      };
    }
    const merchants = await Merchant.find(query).sort({ riskTier: 1 });
    res.json(merchants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
