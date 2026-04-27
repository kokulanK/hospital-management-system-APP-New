const SupplyRequest = require('../models/SupplyRequest');

// @desc    Create a new supply request (cleaning staff only)
// @route   POST /api/supply-requests
// @access  Private (cleaningStaff)
const createSupplyRequest = async (req, res) => {
  try {
    const { itemName, quantity, notes } = req.body;

    const request = await SupplyRequest.create({
      staff: req.user._id,
      itemName,
      quantity,
      notes: notes || '',
      status: 'pending'
    });

    res.status(201).json(request);
  } catch (error) {
    console.error('Create supply request error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged-in staff's own supply requests
// @route   GET /api/supply-requests/my
// @access  Private (cleaningStaff)
const getMySupplyRequests = async (req, res) => {
  try {
    const requests = await SupplyRequest.find({ staff: req.user._id })
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get my supply requests error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get ALL supply requests (admin only)
// @route   GET /api/supply-requests
// @access  Private (admin)
const getAllSupplyRequests = async (req, res) => {
  try {
    const requests = await SupplyRequest.find()
      .populate('staff', 'name email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get all supply requests error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update status of a supply request (admin only)
// @route   PUT /api/supply-requests/:id
// @access  Private (admin)
const updateSupplyRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'delivered'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "approved" or "delivered"' });
    }

    const request = await SupplyRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = status;
    if (status === 'approved') request.approvedAt = Date.now();
    if (status === 'delivered') request.deliveredAt = Date.now();

    await request.save();
    res.json(request);
  } catch (error) {
    console.error('Update supply request error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSupplyRequest,
  getMySupplyRequests,
  getAllSupplyRequests,
  updateSupplyRequestStatus
};