const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  addAvailability,
  getMyAvailability,
  deleteAvailability,
  getDoctorSlots
} = require('../controllers/availabilityController');

const router = express.Router();

router.route('/')
  .post(protect, authorize('doctor'), addAvailability)
  .get(protect, authorize('doctor'), getMyAvailability);

router.route('/:id')
  .delete(protect, authorize('doctor'), deleteAvailability);

router.get('/doctor/:doctorId', protect, getDoctorSlots);

module.exports = router;