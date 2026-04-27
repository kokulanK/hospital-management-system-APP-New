const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createSupplyRequest,
  getMySupplyRequests,
  getAllSupplyRequests,
  updateSupplyRequestStatus
} = require('../controllers/supplyRequestController');

const router = express.Router();

// Routes for cleaning staff
router.post('/', protect, authorize('cleaningStaff'), createSupplyRequest);
router.get('/my', protect, authorize('cleaningStaff'), getMySupplyRequests);

// Routes for admin
router.get('/', protect, authorize('admin'), getAllSupplyRequests);
router.put('/:id', protect, authorize('admin'), updateSupplyRequestStatus);

module.exports = router;