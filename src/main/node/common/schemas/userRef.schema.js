const mongoose = require('mongoose');

const UserRefSchema = new mongoose.Schema({
  id: { type: String, required: true, index: true },
  type: { type: String, required: true, index: true }
}, { _id: false });

module.exports = UserRefSchema;
