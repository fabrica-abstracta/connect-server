const mongoose = require('mongoose');

const subscriptionPaymentsSchema = new mongoose.Schema({
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'account_subscriptions',
    required: true,
    index: true,
    unique: true
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'PEN' },
  evidence: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Files', required: true }],
  note: { type: String, maxLength: 200 },
  createdAt: { type: Date, default: Date.now, required: true },
  transaction: { type: String, maxLength: 64, required: true, unique: true, index: true }
}, {
  timestamps: true,
  collection: 'subscription_payments'
});

module.exports = mongoose.model('subscription_payments', subscriptionPaymentsSchema);
