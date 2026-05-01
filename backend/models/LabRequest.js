const mongoose = require('mongoose');

const labRequestSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testType: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'completed'],
    default: 'pending'
  },
  resultFile: { type: String },           // Cloudinary URL
  publicId: { type: String },              // Cloudinary public ID (optional)
  resultText: { type: String },
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acceptedAt: { type: Date },
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('LabRequest', labRequestSchema);