const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SaasSubscription',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'PEN',
    enum: ['PEN', 'USD', 'EUR']
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['bank_transfer', 'cash', 'mobile_payment', 'other'],
    default: 'bank_transfer'
  },
  evidenceImage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: false
  },
  transactionId: {
    type: String,
    trim: true,
    maxlength: 100
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processing'],
    default: 'pending',
    index: true
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'payments'
});

paymentSchema.pre('save', function(next) {
  if (!this.evidenceImage && !this.transactionId) {
    return next(new Error('Either evidenceImage or transactionId must be provided'));
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
