const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String, // ej.: support, notification, integration, customization, analytics
    required: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'saas_features'
});

module.exports = mongoose.model('SaasFeature', featureSchema);
