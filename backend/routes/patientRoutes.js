const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getPersonalizedTip } = require('../controllers/tipController');

const router = express.Router();

router.get('/tip', protect, authorize('patient'), getPersonalizedTip);

module.exports = router;