const mongoose = require('mongoose');

const rsbOrderSchema = new mongoose.Schema({
  order_id:       { type: String, unique: true, required: true },
  client_name:    { type: String, required: true },
  product_name:   { type: String, default: 'Under Carriage / Track Frame' },
  quantity:       { type: Number, required: true, min: 1 },
  status:         { type: String, default: 'Active', enum: ['Active', 'Completed', 'Pending'] },
  completed_units:{ type: Number, default: 0 },
  created_at:     { type: Date, default: Date.now },
});

module.exports = mongoose.model('RSBOrder', rsbOrderSchema);
