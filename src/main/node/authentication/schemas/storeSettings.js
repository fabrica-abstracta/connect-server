const mongoose = require('mongoose');

const storeSettingsSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'stores',
    required: true,
    index: true,
    unique: true
  },
  showStock: { type: Boolean, default: false },
  infiniteStock: { type: Boolean, default: false },
  showItemsWithPromotions: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: false }
}, {
  timestamps: true,
  collection: 'store_settings'
});

module.exports = mongoose.model('store_settings', storeSettingsSchema);

