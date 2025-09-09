const mongoose = require('mongoose');

const accountProfileSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "accounts",
    required: true,
    index: true,
    unique: true
  },
  profilePhoto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "files",
  },
  biography: {
    type: String,
    maxLength: [500, 'La biografía debe tener como máximo 500 caracteres'],
    trim: true
  },
  timezone: {
    type: String,
    default: 'UTC',
    trim: true
  },
  language: {
    type: String,
    default: 'es',
    trim: true
  }
}, {
  timestamps: true,
  collection: 'account_profiles'
});

module.exports = mongoose.model('account_profiles', accountProfileSchema);
