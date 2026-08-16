const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  upiId: { type: String, required: true },
  avatar: { type: String, default: '' },
  category: { type: String, default: 'friend' },
  frequency: { type: Number, default: 1 }
}, { _id: false });

const customerSchema = new mongoose.Schema({
  customerId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  upiId: { type: String, required: true, unique: true },
  avatar: { type: String, default: '' },
  balance: { type: Number, default: 50000 },
  avgTransaction: { type: Number, default: 500 },
  stdTransaction: { type: Number, default: 150 },
  usualLocation: { type: String, default: 'Bangalore, IN' },
  knownDevices: { type: [String], default: ['Pixel-8-Pro'] },
  accountAgeDays: { type: Number, default: 365 },
  typicalHours: { type: String, default: '07:00-23:00' },
  totalTransactions: { type: Number, default: 0 },
  savedContacts: { type: [contactSchema], default: [] },
  securityScore: { type: Number, default: 85, min: 0, max: 100 },
  dataSource: { type: String, default: 'demo' },
  networkRiskTier: { type: Number, default: 1, min: 1, max: 5 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Customer', customerSchema);
