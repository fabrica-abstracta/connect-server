const mongoose = require('mongoose');
const { UserRefSchema } = require('../../common');

const TransactionsHistorySchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true, index: true, minlength: 1, maxlength: 32 },
  note: { type: String, required: false, minlength: 1, maxlength: 128 },
  counterpartyType: { type: String, required: true, enum: ['client', 'provider'], index: true },
  counterparty: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  direction: { type: String, required: true, enum: ['in', 'out', 'neutral'], index: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'warehouses', required: true, index: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'stores', required: true, index: true },
  isVisible: { type: Boolean, default: true, index: true },
  createdBy: { type: UserRefSchema, required: true },
  updatedBy: { type: UserRefSchema, required: true }
}, { timestamps: true });

module.exports = mongoose.model('transactions_history', TransactionsHistorySchema);
