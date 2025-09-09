const mongoose = require('mongoose');

const accountRecoveries = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "accounts",
    required: true,
    index: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    index: true,
    enum: ['active', 'used', 'expired'],
    default: 'active'
  }
}, {
  collection: 'account_recoveries'
});

module.exports = mongoose.model('account_recoveries', accountRecoveries);
