const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

exports.addUser = async (req, res, next) => {
  try {
    const { name, email, password, role, assigned_stage } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      user_id: crypto.randomUUID(),
      name,
      email,
      password: hashedPassword,
      role,
      assigned_stage
    });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const updates = req.body;
    if (updates.password) updates.password = await bcrypt.hash(updates.password, 10);
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};