const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del archivo es obligatorio'],
    trim: true
  },
  buffer: {
    type: Buffer,
    required: [true, 'El buffer del archivo es obligatorio']
  },
  mimetype: {
    type: String,
    required: [true, 'El tipo MIME es obligatorio'],
    trim: true
  }
}, {
  timestamps: true,
  collection: 'files'
});

module.exports = mongoose.model('files', fileSchema);