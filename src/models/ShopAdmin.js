const mongoose = require('mongoose');

module.exports = mongoose.model('ShopAdmin', new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
    index: true,
  },

}, { versionKey: false, timestamps: false }));
