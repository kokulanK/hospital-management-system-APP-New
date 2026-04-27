const mongoose = require('mongoose');

const cleaningTaskSchema = new mongoose.Schema({
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  area: { type: String, required: true },          // e.g., "Ward 3", "Reception", "Lab"
  date: { type: Date, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  completedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('CleaningTask', cleaningTaskSchema);