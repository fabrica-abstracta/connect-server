const mongoose = require('mongoose');

const planCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true,
    minlength: 6,
    maxlength: 6,
  },
  daysTrial: {
    type: Number,
    default: 0
  },
  preferentialPrice: {
    type: Number
  },
  currency: {
    type: String,
    default: 'PEN'
  },
  priceValidityMonths: {
    type: Number
  },
  plan: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['valid', 'used', 'expired'],
    default: 'valid',
    index: true
  }
}, {
  timestamps: true,
  collection: 'plan_codes'
});

module.exports = mongoose.model('plan_codes', planCodeSchema);
