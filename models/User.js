const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  user_id: { type: String, unique: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  token: { type: String},
  role: { type: String, required: true }, // Admin, Supervisor, Operator
  assigned_stage: { type: String } // For Operators
});

module.exports = mongoose.model('User', userSchema);