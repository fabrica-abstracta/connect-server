const mongoose = require('mongoose');

const componentSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String, // ej.: input, select, textarea
    required: true
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppModule',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'saas_components'
});

module.exports = mongoose.model('SaasComponent', componentSchema);
