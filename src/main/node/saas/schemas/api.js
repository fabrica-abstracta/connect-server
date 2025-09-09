const mongoose = require('mongoose');

const apiSchema = new mongoose.Schema({
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
    type: String
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    required: true
  },
  version: {
    type: String,
    default: 'v1'
  },
  endpoint: {
    type: String,
    required: true
  },
  component: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppComponent',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'saas_apis'
});

module.exports = mongoose.model('SaasApi', apiSchema);
