const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  order_id: { type: String, unique: true, required: true },
  client_name: { type: String, required: true },
  product_name: { type: String, required: true },
  quantity: { type: Number, required: true },
  status: { type: String, default: 'Pending' }, // Pending, Active, Completed
  created_at: { type: Date, default: Date.now },

  // Engenx Traceability Fields
  plant_name: { type: String, default: 'Main Plant' },   // Manufacturing plant name
  batch_id: { type: String },                             // Auto-generated batch identifier
  sop_reference: { type: String }                         // SOP document reference number
});

module.exports = mongoose.model('Order', orderSchema);