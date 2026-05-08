const mongoose = require('mongoose');

const stageHistorySchema = new mongoose.Schema({
  stage_name: String,
  entry_time: Date,
  exit_time: Date,
  operator: String,
  remarks: String,
  scanned_at: { type: Date, default: Date.now } // Timestamped digital record per stage
});

const itemSchema = new mongoose.Schema({
  item_id: { type: String, unique: true, required: true },
  order_id: { type: String, required: true },
  current_stage: { type: String, required: true },
  stage_history: [stageHistorySchema],
  status: { type: String, default: 'In Progress' }, // In Progress, Completed, Rejected, On Hold
  qr_code: { type: String }, // Base64 or URL

  // Engenx Traceability Fields
  batch_number: { type: String },         // e.g. BATCH-20260508-0001
  metal_tag_id: { type: String },         // Physical metal tag ID printed on part
  part_category: { type: String, default: 'General' }, // Structural, Mechanical, Electrical, General
  validation_status: { type: String, default: 'Pending' }, // Pending, Passed, Failed
  scanned_at: { type: Date }              // Last QR scan timestamp
});

module.exports = mongoose.model('Item', itemSchema);