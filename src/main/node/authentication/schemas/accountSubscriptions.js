const mongoose = require('mongoose');

const accountSubscriptionSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'accounts',
    required: true,
    index: true,
    unique: true
  },
  plan: { type: String, required: true, index: true },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['trial', 'promo', 'active', 'suspended', 'processing'],
    default: 'trial',
    required: true
  }
}, {
  timestamps: true,
  collection: 'account_subscriptions'
});

module.exports = mongoose.model('account_subscriptions', accountSubscriptionSchema);
