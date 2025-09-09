const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
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
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppPlan',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'app_modules'
});

module.exports = mongoose.model('AppModule', moduleSchema);
