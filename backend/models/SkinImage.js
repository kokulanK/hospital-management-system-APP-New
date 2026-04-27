const mongoose = require('mongoose');

const skinImageSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  imageUrl: { 
    type: String, 
    required: true 
  },
  publicId: { 
    type: String,
    required: true
  },
  analysisResult: { 
    type: mongoose.Schema.Types.Mixed,  // allows storing objects/arrays
    default: {} 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('SkinImage', skinImageSchema);