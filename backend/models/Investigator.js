const mongoose = require('mongoose');

const investigatorSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['analyst', 'senior', 'admin'], default: 'analyst' },
  name: { type: String, default: 'Security Analyst' },
  assignedAlerts: { type: [String], default: [] }
}, {
  timestamps: true
});

module.exports = mongoose.model('Investigator', investigatorSchema);
