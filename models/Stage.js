const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  order: { type: Number, required: true } // For sequencing
});

module.exports = mongoose.model('Stage', stageSchema);