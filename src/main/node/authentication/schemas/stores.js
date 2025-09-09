const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'accounts',
    required: true,
    index: true,
    unique: true
  },
  name: {
    type: String,
    lowercase: true,
    trim: true,
    required: true,
    minLength: [2, 'El nombre debe tener al menos 2 caracteres'],
    maxLength: [32, 'El nombre debe tener como máximo 32 caracteres'],
  },
  description: {
    type: String,
    lowercase: true,
    maxLength: [500, 'La biografía debe tener como máximo 500 caracteres'],
    trim: true
  },
  sector: { type: String, default: 'restaurant', required: true },
  terminology: {
    local: { type: String, default: 'local', required: true },
    level: { type: String, default: 'piso', required: true },
    space: { type: String, default: 'mesa', required: true }
  },
  address: {
    street: {
      type: String,
      maxlength: [300, 'La calle debe tener como máximo 300 caracteres'],
      trim: true
    },
    city: {
      type: String,
      maxlength: [300, 'La ciudad debe tener como máximo 300 caracteres'],
      trim: true
    },
    state: {
      type: String,
      maxlength: [300, 'El estado debe tener como máximo 300 caracteres'],
      trim: true
    },
    country: {
      type: String,
      maxlength: [300, 'El país debe tener como máximo 300 caracteres'],
      trim: true
    },
    zipCode: {
      type: String,
      maxlength: [8, 'El código postal debe tener como máximo 8 caracteres'],
      trim: true
    },
    coordinates: {
      latitude: {
        type: String,
        maxlength: [300, 'La latitud debe tener como máximo 300 caracteres'],
        trim: true
      },
      longitude: {
        type: String,
        maxlength: [300, 'La longitud debe tener como máximo 300 caracteres'],
        trim: true
      }
    }
  },
  contact: {
    phone: {
      type: String,
      maxlength: [12, 'El teléfono debe tener como máximo 12 caracteres'],
      trim: true
    },
    email: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      maxlength: [300, 'El sitio web debe tener como máximo 300 caracteres'],
      trim: true
    }
  }
}, {
  timestamps: true,
  collection: 'stores'
});

module.exports = mongoose.model('stores', storeSchema);
