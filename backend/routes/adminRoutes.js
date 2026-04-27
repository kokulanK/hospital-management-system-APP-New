const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');

const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/adminUserController');

const {
  getAllAppointmentsAdmin,
  deleteAppointmentAdmin
} = require('../controllers/adminAppointmentController');

const {
  getAllFeedbackAdmin,
  deleteFeedbackAdmin
} = require('../controllers/adminFeedbackController');

// ✅ NEW: Import approval controller
const {
  getPendingUsers,
  approveUser,
  rejectUser
} = require('../controllers/adminApprovalController');

const router = express.Router();

// All routes require admin access
router.use(protect, authorize('admin'));


// =======================
// User Management
// =======================
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);


// =======================
// User Approval Management (NEW)
// =======================
router.get('/pending-users', getPendingUsers);
router.put('/approve-user/:id', approveUser);
router.put('/reject-user/:id', rejectUser);


// =======================
// Appointment Management
// =======================
router.get('/appointments', getAllAppointmentsAdmin);
router.delete('/appointments/:id', deleteAppointmentAdmin);


// =======================
// Feedback Management
// =======================
router.get('/feedback', getAllFeedbackAdmin);
router.delete('/feedback/:id', deleteFeedbackAdmin);


module.exports = router;