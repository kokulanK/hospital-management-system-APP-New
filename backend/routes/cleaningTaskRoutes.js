const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getMyTasks,
  completeTask,
  createTask,
  getAllTasks,
  updateTask,
  deleteTask
} = require('../controllers/cleaningTaskController');

const router = express.Router();

// Routes for cleaning staff
router.get('/my', protect, authorize('cleaningStaff'), getMyTasks);
router.put('/:id/complete', protect, authorize('cleaningStaff'), completeTask);

// Admin & Receptionist routes
router.route('/')
  .get(protect, authorize('admin', 'receptionist'), getAllTasks)
  .post(protect, authorize('admin', 'receptionist'), createTask);

router.route('/:id')
  .put(protect, authorize('admin', 'receptionist'), updateTask)
  .delete(protect, authorize('admin', 'receptionist'), deleteTask);

module.exports = router;