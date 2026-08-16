const mongoose = require('mongoose');

const merchantSchema = new mongoose.Schema({
  merchantId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  upiId: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  logo: { type: String, default: '' },
  riskTier: { type: Number, required: true, min: 1, max: 5, default: 1 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Merchant', merchantSchema);
