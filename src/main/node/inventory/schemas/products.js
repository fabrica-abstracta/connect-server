const mongoose = require('mongoose');
const { UserRefSchema } = require('../../common');

const productSchema = new mongoose.Schema({
  sku: { type: String, unique: true, required: true, index: true },
  barcode: { type: String, unique: true, sparse: true },
  name: { type: String, required: true, index: true, minlength: 1, maxlength: 32 },
  description: { type: String, maxlength: 64 },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'brands', sparse: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'categories', sparse: true },
  unit: { type: mongoose.Schema.Types.ObjectId, ref: 'units', sparse: true },
  salePrice: { type: Number, required: true },
  saleCurrency: { type: String, default: 'PEN', minlength: 2, maxlength: 6, sparse: true },
  stockCurrent: { type: Number, default: 0 },
  stockMin: { type: Number, default: 0 },
  stockReserved: { type: Number, default: 0 },
  status: { type: String, enum: ['available', 'for_exhaustion', 'exhausted'], default: 'available', index: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'stores', required: true, index: true },
  isVisible: { type: Boolean, default: true, index: true },
  createdBy: UserRefSchema,
  updatedBy: UserRefSchema
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);