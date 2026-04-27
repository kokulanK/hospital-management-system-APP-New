const mongoose = require('mongoose');

const supplyRequestSchema = new mongoose.Schema({
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  status: {
    type: String,
    enum: ['pending', 'approved', 'delivered'],
    default: 'pending'
  },
  notes: { type: String, default: '' },
  approvedAt: { type: Date },
  deliveredAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('SupplyRequest', supplyRequestSchema);