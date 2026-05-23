const mongoose = require('mongoose');

const rsbUnitSchema = new mongoose.Schema({
  unit_id:     { type: String, unique: true, required: true },
  order_id:    { type: String, required: true },
  unit_index:  { type: Number, required: true }, // 1, 2, 3 ...
  car_body_id: { type: String, required: true },
  lsf_id:      { type: String, required: true },
  rsf_id:      { type: String, required: true },
  status:      { type: String, default: 'in_progress', enum: ['in_progress', 'completed'] },
  created_at:  { type: Date, default: Date.now },
});

module.exports = mongoose.model('RSBUnit', rsbUnitSchema);
