const LabRequest = require('../models/LabRequest');
const User = require('../models/User');
// Optional: const cloudinary = require('../config/cloudinary'); // Only if you want to delete old files

// ================= EXISTING FUNCTIONS =================

// @desc Create a lab request (doctor only)
const createLabRequest = async (req, res) => {
  try {
    const { patientId, testType, description } = req.body;

    const patient = await User.findOne({ _id: patientId, role: 'patient' });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const request = await LabRequest.create({
      doctor: req.user._id,
      patient: patientId,
      testType,
      description
    });

    res.status(201).json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Get doctor lab requests
const getDoctorLabRequests = async (req, res) => {
  try {
    const requests = await LabRequest.find({ doctor: req.user._id })
      .populate('patient', 'name email')
      .populate('acceptedBy', 'name')
      .sort('-createdAt');

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Get lab technician requests (including completed)
const getLabTechnicianRequests = async (req, res) => {
  try {
    const requests = await LabRequest.find({
      status: { $in: ['pending', 'accepted', 'completed'] }
    })
      .populate('doctor', 'name email')
      .populate('patient', 'name email')
      .populate('acceptedBy', 'name')
      .sort('-createdAt');

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Accept request
const acceptLabRequest = async (req, res) => {
  try {
    const request = await LabRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    request.status = 'accepted';
    request.acceptedBy = req.user._id;
    request.acceptedAt = new Date();

    await request.save();

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Complete request
const completeLabRequest = async (req, res) => {
  try {
    const request = await LabRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.status !== 'accepted') {
      return res.status(400).json({ message: 'Request must be accepted first' });
    }

    if (req.file) {
      request.resultFile = req.file.path;
      request.publicId = req.file.filename;
    }

    request.status = 'completed';
    request.resultText = req.body.resultText || request.resultText;
    request.completedAt = new Date();

    await request.save();

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Get single request
const getLabRequestById = async (req, res) => {
  try {
    const request = await LabRequest.findById(req.params.id)
      .populate('doctor', 'name email')
      .populate('patient', 'name email')
      .populate('acceptedBy', 'name');

    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (
      request.doctor._id.toString() !== req.user._id.toString() &&
      (!request.acceptedBy ||
        request.acceptedBy._id.toString() !== req.user._id.toString()) &&
      req.user.role !== 'labTechnician'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ================= UPDATED FUNCTIONS =================

// @desc Update a lab request (doctor or lab technician)
// @route PUT /api/lab-requests/:id
// @access Private (doctor or labTechnician)
const updateLabRequest = async (req, res) => {
  try {
    const request = await LabRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    // Permission checks
    if (req.user.role === 'doctor') {
      if (request.doctor.toString() !== req.user._id.toString())
        return res.status(403).json({ message: 'Not authorized' });

      if (request.status !== 'pending')
        return res.status(400).json({ message: 'Cannot edit request after acceptance' });

    } else if (req.user.role === 'labTechnician') {
      if (!['accepted', 'completed'].includes(request.status))
        return res.status(400).json({ message: 'Can only edit accepted or completed requests' });

      if (!request.acceptedBy || request.acceptedBy.toString() !== req.user._id.toString())
        return res.status(403).json({ message: 'Not authorized' });

    } else {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Extract text fields from request body (populated by multer)
    const { testType, description, resultText } = req.body;

    if (testType) request.testType = testType;
    if (description !== undefined) request.description = description;
    if (resultText !== undefined) request.resultText = resultText;

    // Handle file upload (if any)
    if (req.file) {
      // Optional: Delete old file from Cloudinary to save space
      // if (request.publicId) {
      //   await cloudinary.uploader.destroy(request.publicId);
      // }
      request.resultFile = req.file.path;
      request.publicId = req.file.filename;
    }

    await request.save();

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Delete a lab request (doctor or lab technician)
// @route DELETE /api/lab-requests/:id
// @access Private (doctor or labTechnician)
const deleteLabRequest = async (req, res) => {
  try {
    const request = await LabRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (req.user.role === 'doctor') {
      if (request.doctor.toString() !== req.user._id.toString())
        return res.status(403).json({ message: 'Not authorized' });

      if (request.status !== 'pending')
        return res.status(400).json({ message: 'Cannot delete request after acceptance' });

    } else if (req.user.role === 'labTechnician') {
      if (!['accepted', 'completed'].includes(request.status))
        return res.status(400).json({ message: 'Can only delete accepted or completed requests' });

      if (!request.acceptedBy || request.acceptedBy.toString() !== req.user._id.toString())
        return res.status(403).json({ message: 'Not authorized' });

    } else {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await request.deleteOne();

    res.json({ message: 'Request deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ================= NEW FUNCTION FOR PATIENTS =================

// @desc    Get completed lab requests for logged-in patient
// @route   GET /api/lab-requests/patient
// @access  Private (patient)
const getPatientLabRequests = async (req, res) => {
  try {
    const requests = await LabRequest.find({
      patient: req.user._id,
      status: 'completed'
    })
      .populate('doctor', 'name email')
      .sort('-completedAt');
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ================= EXPORTS =================

module.exports = {
  createLabRequest,
  getDoctorLabRequests,
  getLabTechnicianRequests,
  acceptLabRequest,
  completeLabRequest,
  getLabRequestById,
  updateLabRequest,
  deleteLabRequest,
  getPatientLabRequests   // <-- make sure this is included
};