const mongoose = require('mongoose');

const stageHistorySchema = new mongoose.Schema({
  stage_name: String,
  entry_time: Date,
  exit_time: Date,
  operator: String,
  remarks: String
});

const itemSchema = new mongoose.Schema({
  item_id: { type: String, unique: true, required: true },
  order_id: { type: String, required: true },
  current_stage: { type: String, required: true },
  stage_history: [stageHistorySchema],
  status: { type: String, default: 'In Progress' }, // In Progress, Completed, Rejected, On Hold
  qr_code: { type: String } // Base64 or URL
});

module.exports = mongoose.model('Item', itemSchema);