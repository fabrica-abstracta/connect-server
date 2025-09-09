

const mongoose = require('mongoose');
const { UserRefSchema } = require('../../common');

const BrandsSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true, minlength: 1, maxlength: 32 },
  description: { type: String, required: false, minlength: 1, maxlength: 64 },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'stores', required: true, index: true },
  isVisible: { type: Boolean, default: true, index: true },
  createdBy: { type: UserRefSchema, required: true },
  updatedBy: { type: UserRefSchema, required: true }
}, { timestamps: true });

module.exports = mongoose.model('brands', BrandsSchema);
