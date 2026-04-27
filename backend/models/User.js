// backend/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },

  email: { 
    type: String, 
    required: true, 
    unique: true 
  },

  password: { 
    type: String, 
    required: true 
  },

  role: {
    type: String,
    enum: ['patient', 'doctor', 'receptionist', 'labTechnician', 'admin', 'cleaningStaff'], // added cleaningStaff
    required: true
  },

  // NEW FIELD
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'   // keep existing users approved
  },

  averageRating: { 
    type: Number, 
    default: 0 
  },

}, { timestamps: true });


// Hash password before saving (async) with debug logs
userSchema.pre('save', async function() {
  console.log('Pre-save hook running for email:', this.email);
  console.log('Is password modified?', this.isModified('password'));

  if (!this.isModified('password')) {
    console.log('Password not modified, skipping hash');
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  console.log('Password hashed successfully');
});


// Method to compare entered password with hashed password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


module.exports = mongoose.model('User', userSchema);