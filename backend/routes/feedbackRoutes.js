const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createFeedback,
  getDoctorFeedback,
  getPublicDoctorFeedback,
  getPatientFeedback,
  updateFeedback,           // ✅ added
} = require('../controllers/feedbackController');

const router = express.Router();

// Patient creates feedback
router.post('/', protect, authorize('patient'), createFeedback);

// Patient updates their own feedback
router.put('/:id', protect, authorize('patient'), updateFeedback);   // ✅ new route

// Doctor views their own feedback
router.get('/doctor', protect, authorize('doctor'), getDoctorFeedback);

// Public feedback for a specific doctor
router.get('/doctor/:doctorId', protect, getPublicDoctorFeedback); // optional

// Logged-in patient views their feedback
router.get('/patient', protect, authorize('patient'), getPatientFeedback);

module.exports = router;