const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Not authorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin only' });
  next();
};

exports.adminOrSupervisor = (req, res, next) => {
  if (!['Admin', 'Supervisor'].includes(req.user.role)) return res.status(403).json({ message: 'Admin or Supervisor only' });
  next();
};

exports.operatorOnly = (req, res, next) => {
  if (req.user.role !== 'Operator') return res.status(403).json({ message: 'Operator only' });
  // Optional: Check assigned_stage matches
  next();
};