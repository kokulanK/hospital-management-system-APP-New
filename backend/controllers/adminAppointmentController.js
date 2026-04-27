const Appointment = require('../models/Appointment');

// @desc    Get all appointments
// @route   GET /api/admin/appointments
// @access  Private (admin)
const getAllAppointmentsAdmin = async (req, res) => {
  try {
    const appointments = await Appointment.find({})
      .populate('patient', 'name email')
      .populate('doctor', 'name email')
      .sort({ date: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete an appointment
// @route   DELETE /api/admin/appointments/:id
// @access  Private (admin)
const deleteAppointmentAdmin = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    await appointment.deleteOne();
    res.json({ message: 'Appointment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllAppointmentsAdmin, deleteAppointmentAdmin };