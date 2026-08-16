const jwt = require('jsonwebtoken');
const Investigator = require('../models/Investigator');

const JWT_SECRET = process.env.JWT_SECRET || 'paytelemetry_jwt_secret_dev_key_2026';

/**
 * Verifies JWT for protected routes
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const investigator = await Investigator.findById(decoded.id).select('-passwordHash');
    if (!investigator) {
      return res.status(401).json({ error: 'User not found or token invalid' });
    }

    req.user = investigator;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Requires admin role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  next();
};

module.exports = {
  JWT_SECRET,
  requireAuth,
  requireAdmin
};
