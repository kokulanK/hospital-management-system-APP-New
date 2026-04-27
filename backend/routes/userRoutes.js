// backend/routes/userRoutes.js

const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  getPatients,
  createPatient,
  getCleaningStaff
} = require('../controllers/userController');

const router = express.Router();

// ======================
// User profile routes: GET, PUT, DELETE
// ======================
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile)
  .delete(protect, deleteUserProfile);

// ======================
// Patient search and creation for receptionist/admin/doctor
// ======================
router.get('/patients', protect, authorize('receptionist', 'admin', 'doctor'), getPatients);
router.post('/patients', protect, authorize('receptionist'), createPatient);

// ======================
// Cleaning staff list for receptionist/admin
// ======================
router.get('/cleaning-staff', protect, authorize('receptionist', 'admin'), getCleaningStaff);

module.exports = router;