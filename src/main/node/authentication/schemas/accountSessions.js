const mongoose = require('mongoose');

const sessionAccountSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "accounts",
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'logout'],
    default: 'active',
    required: true
  }
}, {
  timestamps: true,
  collection: 'account_sessions'
});

module.exports = mongoose.model('account_sessions', sessionAccountSchema);
