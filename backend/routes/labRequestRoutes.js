const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const uploadLab = require('../middleware/labUploadMiddleware');
const {
  createLabRequest,
  getDoctorLabRequests,
  getLabTechnicianRequests,
  acceptLabRequest,
  completeLabRequest,
  getLabRequestById,
  updateLabRequest,
  deleteLabRequest,
  getPatientLabRequests
} = require('../controllers/labRequestController');

const router = express.Router();

// Doctor routes
router.post('/', protect, authorize('doctor'), createLabRequest);
router.get('/doctor', protect, authorize('doctor'), getDoctorLabRequests);

// Lab technician routes
router.get('/lab', protect, authorize('labTechnician'), getLabTechnicianRequests);
router.put('/:id/accept', protect, authorize('labTechnician'), acceptLabRequest);
router.put('/:id/complete', protect, authorize('labTechnician'), uploadLab.single('resultFile'), completeLabRequest);

// Patient route – MUST come before /:id
router.get('/patient', protect, authorize('patient'), getPatientLabRequests);

// Shared (doctor or lab technician) – UPDATE and DELETE
router.put('/:id', protect, authorize('doctor', 'labTechnician'), uploadLab.single('resultFile'), updateLabRequest);
router.delete('/:id', protect, authorize('doctor', 'labTechnician'), deleteLabRequest);

// Shared – get by ID (must be after all static routes)
router.get('/:id', protect, authorize('doctor', 'labTechnician'), getLabRequestById);

module.exports = router;