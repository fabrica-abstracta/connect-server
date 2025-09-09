const mongoose = require('mongoose');

const subscriptionsUseSchema = new mongoose.Schema({
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'account_subscriptions',
    required: true,
    index: true,
    unique: true
  },
  storage: { type: Number, default: 0 },
  staff: { type: Number, default: 0 }
}, {
  timestamps: true,
  collection: 'subscriptions_use'
});

module.exports = mongoose.model('subscriptions_use', subscriptionsUseSchema);
