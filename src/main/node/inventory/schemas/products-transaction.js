const mongoose = require('mongoose');
const { UserRefSchema } = require('../../common');

const ProductsTransactionSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true, index: true, minlength: 6, maxlength: 128 },
  barcode: { type: String, required: false, unique: true, index: true, sparse: true, minlength: 1, maxlength: 32 },
  name: { type: String, required: true, index: true, minlength: 1, maxlength: 32 },
  brand: { type: String, required: false, index: true, sparse: true },
  category: { type: String, required: false, index: true, sparse: true },
  unit: { type: String, required: false, index: true, sparse: true },
  unitPrice: { type: Number, required: true },
  currency: { type: String, required: false, default: 'PEN', index: true, sparse: true, minlength: 2, maxlength: 6 },
  quantity: { type: Number, required: false },
  totalPrice: { type: Number, required: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'stores', required: true, index: true },
  createdBy: { type: UserRefSchema, required: true },
  updatedBy: { type: UserRefSchema, required: true }
}, { timestamps: true });

module.exports = mongoose.model('products_transaction', ProductsTransactionSchema);
