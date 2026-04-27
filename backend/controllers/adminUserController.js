const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all users (optionally filter by role)
// @route   GET /api/admin/users
// @access  Private (admin)
const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new user (any role except admin)
// @route   POST /api/admin/users
// @access  Private (admin)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields required' });
    }

    // Allowed roles – admin removed, cleaning staff added
    const allowedRoles = ['patient', 'doctor', 'receptionist', 'labTechnician', 'cleaningStaff'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Prevent admin creation (extra safety)
    if (role === 'admin') {
      return res.status(403).json({ message: 'Admin accounts cannot be created' });
    }

    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password, role });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a user (any role except admin)
// @route   PUT /api/admin/users/:id
// @access  Private (admin)
const updateUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent editing admin accounts
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Admin accounts cannot be modified' });
    }

    if (name) user.name = name;
    if (email) user.email = email;

    if (role) {
      const allowedRoles = ['patient', 'doctor', 'receptionist', 'labTechnician', 'cleaningStaff'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      user.role = role;
    }

    if (password) {
      user.password = password; // pre-save hook will hash
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private (admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting any admin account (including super admin)
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Admin accounts cannot be deleted' });
    }

    // Also check super admin email (backup safety)
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'super@admin.com';
    if (user.email === SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Super admin cannot be deleted' });
    }

    await user.deleteOne();

    res.json({ message: 'User deleted' });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
};