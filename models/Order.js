const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  order_id: { type: String, unique: true, required: true },
  client_name: { type: String, required: true },
  product_name: { type: String, required: true },
  quantity: { type: Number, required: true },
  status: { type: String, default: 'Pending' }, // Pending, Active, Completed
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);