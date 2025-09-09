const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'PEN'
  },
  billingPeriod: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true,
    default: 'monthly'
  },
  trialDays: {
    type: Number,
    required: true,
    default: 7
  },
  limits: {
    storage: {
      unit: {
        type: String,
        default: 'MB'
      },
      limit: {
        type: Number,
        default: 1
      },
    },
    staff: {
      unit: {
        type: String,
        default: 'accounts'
      },
      limit: {
        type: Number,
        default: 1
      },
    }
  },
  modules: [{
    type: String,
    required: true
  }],
  features: [{
    type: String,
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'app_plans'
});

module.exports = mongoose.model('AppPlan', planSchema);
