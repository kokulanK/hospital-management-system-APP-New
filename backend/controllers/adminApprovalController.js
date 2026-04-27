const User = require('../models/User');

// @desc    Get pending users (admin only)
// @route   GET /api/admin/pending-users
// @access  Private (admin)
const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ status: 'pending' }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve a user
// @route   PUT /api/admin/approve-user/:id
// @access  Private (admin)
const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Only super admin can approve other admins
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'super@admin.com';
    if (user.role === 'admin' && req.user.email !== SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Only super admin can approve admin accounts' });
    }

    user.status = 'approved';
    await user.save();
    res.json({ message: 'User approved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject a user (delete or just mark rejected)
// @route   PUT /api/admin/reject-user/:id
// @access  Private (admin)
const rejectUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Only super admin can reject admins
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'super@admin.com';
    if (user.role === 'admin' && req.user.email !== SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Only super admin can reject admin accounts' });
    }

    user.status = 'rejected';
    await user.save();
    // Or delete the user: await user.deleteOne();
    res.json({ message: 'User rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getPendingUsers, approveUser, rejectUser };