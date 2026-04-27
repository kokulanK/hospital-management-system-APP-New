// backend/controllers/authController.js

const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    console.log('Register attempt:', { email, role });

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const allowedRoles = [
      'patient',
      'doctor',
      'receptionist',
      'labTechnician',
      'cleaningStaff'
      // ❌ removed 'admin'
    ];

    if (!allowedRoles.includes(role) && role !== 'admin') {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // 🔒 Block normal admin registration
    if (role === 'admin' && email !== process.env.SUPER_ADMIN_EMAIL) {
      return res.status(403).json({
        message: 'Admin accounts cannot be created by registration. Only the super admin exists.'
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({ name, email, password, role });

    // Roles that require admin approval (❌ removed admin)
    const requiresApproval = [
      'doctor',
      'receptionist',
      'labTechnician',
      'cleaningStaff'
    ].includes(role);

    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'super@admin.com';

    // 🔐 Super admin skips approval
    if (requiresApproval && email !== SUPER_ADMIN_EMAIL) {
      user.status = 'pending';
      await user.save();

      return res.status(201).json({
        message: 'Registration successful. Please wait for admin approval.',
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      });
    }

    console.log('User created:', user.email);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      token: generateToken(user._id)
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};


// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    const user = await User.findOne({ email });
    console.log('User found in DB:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 🔒 Check approval status
    if (user.status !== 'approved') {
      return res.status(403).json({
        message: 'Account not approved yet. Please wait for admin approval.'
      });
    }

    console.log('Stored password hash:', user.password);

    const isMatch = await user.comparePassword(password);
    console.log('Password match result:', isMatch);

    if (isMatch) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

module.exports = { registerUser, loginUser };