const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    previousStock: { type: Number, required: true },
    changeAmount: { type: Number, required: true },
    newStock: { type: Number, required: true },
    reason: { type: String, required: true },
    actorName: { type: String, default: 'System' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
