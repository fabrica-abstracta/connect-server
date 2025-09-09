const mongoose = require('mongoose');
const { UserRefSchema } = require('../../common');

const WarehouseSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 1, maxlength: 32, index: true },
  description: { type: String, required: false, minlength: 1, maxlength: 64 },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'stores', required: true, index: true },
  isVisible: { type: Boolean, default: true, index: true },
  createdBy: UserRefSchema,
  updatedBy: UserRefSchema
}, { timestamps: true });

module.exports = mongoose.model('warehouses', WarehouseSchema);
