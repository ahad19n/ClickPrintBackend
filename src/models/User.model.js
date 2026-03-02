const mongoose = require('mongoose');

module.exports = mongoose.model('User', new mongoose.Schema({

  name: { type: String, default: '' },
  balance: { type: Number, default: 0 },
  number: { type: String, required: true, unique: true, index: true },

}, { versionKey: false, timestamps: false }));
