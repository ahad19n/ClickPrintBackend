const mongoose = require('mongoose');
const User = require('./User.model');

module.exports = mongoose.model('File', new mongoose.Schema({

  status: { type: String, required: true },
  mimeType: { type: String, required: true },
  sizeInBytes: { type: Number, required: true },
  originalName: { type: String, required: true },

  createdAt: { type: Date, required: true, default: Date.now() },
  hash: { type: String, required: true, unique: true, index: true },
  uploadedBy: { ref: User, required: true, type: mongoose.Schema.Types.ObjectId },

}, { versionKey: false, timestamps: false }));