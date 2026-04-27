const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');

const {
  bookAppointment,
  receptionistBookAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  getAllAppointments,
  updateAppointmentStatus,
  getDoctorsWithRatings,
  getCompletedAppointmentsWithoutFeedback,
  cancelAppointment,
  rescheduleAppointment
} = require('../controllers/appointmentController');

const router = express.Router();

// =====================
// Patient routes
// =====================
router.post('/', protect, authorize('patient'), bookAppointment);
router.get('/patient', protect, authorize('patient'), getPatientAppointments);
router.get(
  '/completed-without-feedback',
  protect,
  authorize('patient'),
  getCompletedAppointmentsWithoutFeedback
);
router.put('/:id/cancel', protect, authorize('patient'), cancelAppointment);
router.put('/:id/reschedule', protect, authorize('patient'), rescheduleAppointment);

// =====================
// Receptionist routes
// =====================
router.post(
  '/receptionist',
  protect,
  authorize('receptionist'),
  receptionistBookAppointment
);
router.get(
  '/all',
  protect,
  authorize('receptionist', 'admin'),
  getAllAppointments
);

// =====================
// Doctor routes
// =====================
router.get('/doctor', protect, authorize('doctor'), getDoctorAppointments);
router.put('/:id', protect, authorize('doctor'), updateAppointmentStatus);

// =====================
// Doctors list (with ratings)
// =====================
router.get('/doctors', protect, getDoctorsWithRatings);

module.exports = router;