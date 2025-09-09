const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  document: {
    type: String,
    minLength: [8, 'El documento debe tener al menos 8 caracteres'],
    maxLength: [12, 'El documento debe tener como máximo 12 caracteres'],
    required: [true, 'El documento es obligatorio'],
    trim: true,
    index: true,
    unique: true
  },
  paternalSurnames: {
    type: String,
    minLength: [2, 'El apellido paterno debe tener al menos 2 caracteres'],
    maxLength: [32, 'El apellido paterno debe tener como máximo 32 caracteres'],
    trim: true
  },
  maternalSurnames: {
    type: String,
    minLength: [2, 'El apellido materno debe tener al menos 2 caracteres'],
    maxLength: [32, 'El apellido materno debe tener como máximo 32 caracteres'],
    trim: true
  },
  names: {
    type: String,
    minLength: [2, 'El nombre debe tener al menos 2 caracteres'],
    maxLength: [32, 'El nombre debe tener como máximo 32 caracteres'],
    required: true,
    trim: true
  },
  birthday: {
    type: Date,
    validate: {
      validator: function (value) {
        if (!value) return true;
        const hoy = new Date();
        const fecha18 = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
        return value <= fecha18;
      },
      message: 'Debes tener al menos 18 años'
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female']
  },
  email: {
    type: String,
    trim: true,
    required: true,
    unique: true,
    index: true,
    match: [/.+@.+\..+/, 'El correo electrónico no es válido']
  },
  phone: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
    index: true
  },
  password: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'accounts'
});

module.exports = mongoose.model('accounts', accountSchema);
