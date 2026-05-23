const mongoose = require('mongoose');

const stageHistorySchema = new mongoose.Schema({
  stage_name:  { type: String, required: true },
  stage_index: { type: Number, required: true },
  scanned_at:  { type: Date, default: Date.now },
});

const rsbComponentSchema = new mongoose.Schema({
  component_id:         { type: String, unique: true, required: true }, // CB-260522-0001
  component_type:       { type: String, required: true, enum: ['CAR_BODY', 'LEFT_SIDE_FRAME', 'RIGHT_SIDE_FRAME'] },
  display_name:         { type: String, required: true },               // 'Car Body', 'Left Side Frame', 'Right Side Frame'
  order_id:             { type: String, required: true },
  unit_id:              { type: String, required: true },
  unit_index:           { type: Number, required: true },
  current_stage_index:  { type: Number, default: 0 },                   // index of last completed stage
  status:               { type: String, default: 'in_sub_assembly', enum: ['in_sub_assembly', 'in_progress', 'completed'] },
  qr_code:              { type: String },                               // base64 QR image
  qr_url:               { type: String },                               // URL encoded in QR (for Google Lens)
  stage_history:        [stageHistorySchema],
  created_at:           { type: Date, default: Date.now },
});

module.exports = mongoose.model('RSBComponent', rsbComponentSchema);
