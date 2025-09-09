const mongoose = require('mongoose');
const { UserRefSchema } = require('../../common');

const ContactInfoSchema = new mongoose.Schema({
  email: { type: String, required: false, index: true, sparse: true },
  phone: { type: String, required: false, unique: true, index: true, sparse: true, minlength: 9, maxlength: 15 },
  website: { type: String, required: false, unique: true, index: true, sparse: true, minlength: 2, maxlength: 64 }
}, { _id: false });

const AddressSchema = new mongoose.Schema({
  street: { type: String, required: false, minlength: 2, maxlength: 64 }
}, { _id: false });

const ContactsSchema = new mongoose.Schema({
  document: { type: String, required: true, unique: true, index: true },
  type: { type: String, required: true, enum: ['client', 'provider'], default: 'client', index: true },
  name: { type: String, required: true, index: true, minlength: 1, maxlength: 32 },
  description: { type: String, required: false, minlength: 1, maxlength: 64 },
  contact: { type: ContactInfoSchema, required: false },
  address: { type: AddressSchema, required: false },
  isVisible: { type: Boolean, default: true, index: true },
  createdBy: { type: UserRefSchema, required: true },
  updatedBy: { type: UserRefSchema, required: true }
}, { timestamps: true });

module.exports = mongoose.model('contacts', ContactsSchema);
