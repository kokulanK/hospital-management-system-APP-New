const Feedback = require('../models/Feedback');

// @desc    Get all feedback
// @route   GET /api/admin/feedback
// @access  Private (admin)
const getAllFeedbackAdmin = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({})
      .populate('patient', 'name email')
      .populate('appointment', 'date')
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete feedback
// @route   DELETE /api/admin/feedback/:id
// @access  Private (admin)
const deleteFeedbackAdmin = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    await feedback.deleteOne();
    res.json({ message: 'Feedback deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllFeedbackAdmin, deleteFeedbackAdmin };