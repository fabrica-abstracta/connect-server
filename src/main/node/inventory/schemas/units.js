

const mongoose = require('mongoose');
const { UserRefSchema } = require('../../common');

const UnitsSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true, minlength: 1, maxlength: 32 },
  description: { type: String, required: false, minlength: 1, maxlength: 64 },
  symbol: { type: String, required: true, unique: true, index: true, minlength: 1, maxlength: 16 },
  system: { type: String, required: true, enum: ['SI', 'Imperial', 'USC', 'Custom'], default: 'SI', index: true, sparse: true },
  dimension: { type: String, required: true, enum: ['unit', 'mass', 'length', 'time', 'temperature', 'area', 'volume', 'velocity', 'acceleration', 'other'], index: true, minlength: 1, maxlength: 32 },
  isBase: { type: Boolean, required: true, default: false, index: true },
  baseUnit: { type: mongoose.Schema.Types.ObjectId, ref: 'units', required: false, index: true, sparse: true },
  factor: { type: Number, required: true, default: 1 },
  offset: { type: Number, required: false, default: 0, sparse: true },
  numerator: { type: [String], required: false, default: [], sparse: true },
  denominator: { type: [String], required: false, default: [], sparse: true },
  aliases: { type: [String], required: false, default: [], sparse: true },
  precision: { type: Number, required: false, default: 6, sparse: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'stores', required: true, index: true, sparse: true },
  isVisible: { type: Boolean, default: true, index: true },
  createdBy: { type: UserRefSchema, required: true },
  updatedBy: { type: UserRefSchema, required: true }
}, { timestamps: true });

module.exports = mongoose.model('units', UnitsSchema);
