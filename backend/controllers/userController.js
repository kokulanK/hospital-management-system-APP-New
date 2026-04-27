const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');

// ================================
// ✅ User Profile (Logged-in User)
// ================================

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update name only
    user.name = req.body.name || user.name;

    // Email change is disabled
    // user.email = req.body.email || user.email;

    // Password change logic
    if (req.body.newPassword) {
      if (!req.body.currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }

      const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect ❌' });
      }

      if (req.body.newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
      }

      user.password = req.body.newPassword; // hashed via pre-save middleware
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      token: generateToken(updatedUser._id),
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete user profile
// @route   DELETE /api/users/profile
// @access  Private
const deleteUserProfile = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// =====================================
// ✅ Patient Management (Receptionist/Admin)
// =====================================

// @desc    Get patients (for receptionist/admin)
// @route   GET /api/users/patients
// @access  Private (receptionist, admin)
const getPatients = async (req, res) => {
  try {
    const { search } = req.query;
    let filter = { role: 'patient' };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const patients = await User.find(filter).select('name email');
    res.json(patients);

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a patient (receptionist only)
// @route   POST /api/users/patients
// @access  Private (receptionist)
const createPatient = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields required' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const patient = await User.create({ name, email, password, role: 'patient' });

    res.status(201).json({
      _id: patient._id,
      name: patient.name,
      email: patient.email
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// =====================================
// ✅ Cleaning Staff Management
// =====================================

// @desc    Get all cleaning staff (for receptionist/admin)
// @route   GET /api/users/cleaning-staff
// @access  Private (receptionist, admin)
const getCleaningStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: 'cleaningStaff' }).select('name email');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  getPatients,
  createPatient,
  getCleaningStaff
};