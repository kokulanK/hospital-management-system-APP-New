const CleaningTask = require('../models/CleaningTask');

// @desc    Get all tasks for logged-in cleaning staff
// @route   GET /api/cleaning-tasks/my
// @access  Private (cleaningStaff)
const getMyTasks = async (req, res) => {
  try {
    const tasks = await CleaningTask.find({ assignedTo: req.user._id })
      .sort({ date: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark a task as completed
// @route   PUT /api/cleaning-tasks/:id/complete
// @access  Private (cleaningStaff)
const completeTask = async (req, res) => {
  try {
    const task = await CleaningTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Ensure the task is assigned to this staff member
    if (task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (task.status === 'completed') {
      return res.status(400).json({ message: 'Task already completed' });
    }

    task.status = 'completed';
    task.completedAt = new Date();
    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ADMIN ONLY: Create, update, delete tasks

// @desc    Create a new cleaning task (admin)
// @route   POST /api/cleaning-tasks
// @access  Private (admin)
const createTask = async (req, res) => {
  try {
    const { assignedTo, area, date, description } = req.body;
    if (!assignedTo || !area || !date) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const task = await CleaningTask.create({
      assignedTo,
      area,
      date,
      description
    });

    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all tasks (admin) – optionally filter by staff
// @route   GET /api/cleaning-tasks
// @access  Private (admin)
const getAllTasks = async (req, res) => {
  try {
    const { staffId } = req.query;
    const filter = staffId ? { assignedTo: staffId } : {};
    const tasks = await CleaningTask.find(filter)
      .populate('assignedTo', 'name email')
      .sort({ date: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a task (admin)
// @route   PUT /api/cleaning-tasks/:id
// @access  Private (admin)
const updateTask = async (req, res) => {
  try {
    const task = await CleaningTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { area, date, description, status } = req.body;
    if (area) task.area = area;
    if (date) task.date = date;
    if (description !== undefined) task.description = description;
    if (status) task.status = status;

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a task (admin)
// @route   DELETE /api/cleaning-tasks/:id
// @access  Private (admin)
const deleteTask = async (req, res) => {
  try {
    const task = await CleaningTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMyTasks,
  completeTask,
  createTask,
  getAllTasks,
  updateTask,
  deleteTask
};