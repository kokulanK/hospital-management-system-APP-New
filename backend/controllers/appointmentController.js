const Appointment = require('../models/Appointment');
const User = require('../models/User');

// @desc    Book an appointment (patient)
// @route   POST /api/appointments
// @access  Private (patient)
const bookAppointment = async (req, res) => {
  try {
    const { doctorId, startTime } = req.body;

    if (!doctorId || !startTime) {
      return res.status(400).json({ message: 'Doctor and start time are required' });
    }

    const appointmentStart = new Date(startTime);

    if (appointmentStart.getMinutes() % 15 !== 0) {
      return res.status(400).json({ message: 'Appointment must start at 15-minute increments' });
    }

    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const Availability = require('../models/Availability');
    const slotEnd = new Date(appointmentStart.getTime() + 15 * 60000);

    const coveringAvailability = await Availability.findOne({
      doctor: doctorId,
      startTime: { $lte: appointmentStart },
      endTime: { $gte: slotEnd }
    });

    if (!coveringAvailability) {
      return res.status(400).json({ message: 'Doctor not available at that time' });
    }

    const existing = await Appointment.findOne({
      doctor: doctorId,
      date: appointmentStart,
      status: { $ne: 'cancelled' }
    });

    if (existing) {
      return res.status(400).json({ message: 'Slot already booked' });
    }

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      date: appointmentStart,
      status: 'scheduled'
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Book an appointment on behalf of a patient (receptionist)
// @route   POST /api/appointments/receptionist
// @access  Private (receptionist)
const receptionistBookAppointment = async (req, res) => {
  try {
    const { patientName, patientEmail, doctorId, startTime } = req.body;

    if (!patientName || !patientEmail || !doctorId || !startTime) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    let patient = await User.findOne({ email: patientEmail });

    if (!patient) {
      const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
      patient = await User.create({
        name: patientName,
        email: patientEmail,
        password: tempPassword,
        role: 'patient'
      });
    }

    const appointmentStart = new Date(startTime);

    if (appointmentStart.getMinutes() % 15 !== 0) {
      return res.status(400).json({ message: 'Appointment must start at 15-minute increments' });
    }

    const Availability = require('../models/Availability');
    const slotEnd = new Date(appointmentStart.getTime() + 15 * 60000);

    const coveringAvailability = await Availability.findOne({
      doctor: doctorId,
      startTime: { $lte: appointmentStart },
      endTime: { $gte: slotEnd }
    });

    if (!coveringAvailability) {
      return res.status(400).json({ message: 'Doctor not available at that time' });
    }

    const existing = await Appointment.findOne({
      doctor: doctorId,
      date: appointmentStart,
      status: { $ne: 'cancelled' }
    });

    if (existing) {
      return res.status(400).json({ message: 'Slot already booked' });
    }

    const appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctorId,
      date: appointmentStart,
      status: 'scheduled'
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Cancel an appointment (patient)
// @route   PUT /api/appointments/:id/cancel
// @access  Private (patient)
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Allow cancellation only if status is NOT completed or cancelled
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Appointment cannot be cancelled' });
    }

    const now = new Date();
    const appTime = new Date(appointment.date);
    if (appTime - now < 2 * 60 * 60 * 1000) {
      return res.status(400).json({ message: 'Cannot cancel less than 2 hours before appointment' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.json({ message: 'Appointment cancelled successfully', appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reschedule an appointment (patient)
// @route   PUT /api/appointments/:id/reschedule
// @access  Private (patient)
const rescheduleAppointment = async (req, res) => {
  try {
    const { newStartTime } = req.body;
    if (!newStartTime) return res.status(400).json({ message: 'New start time required' });

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Allow reschedule only if status is NOT completed or cancelled
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Appointment cannot be rescheduled' });
    }

    const newDate = new Date(newStartTime);

    if (newDate.getMinutes() % 15 !== 0) {
      return res.status(400).json({ message: 'Appointment must start at 15-minute increments' });
    }

    const Availability = require('../models/Availability');
    const slotEnd = new Date(newDate.getTime() + 15 * 60000);

    const coveringAvailability = await Availability.findOne({
      doctor: appointment.doctor,
      startTime: { $lte: newDate },
      endTime: { $gte: slotEnd }
    });

    if (!coveringAvailability) {
      return res.status(400).json({ message: 'Doctor not available at that time' });
    }

    const existing = await Appointment.findOne({
      doctor: appointment.doctor,
      date: newDate,
      status: { $ne: 'cancelled' },
      _id: { $ne: appointment._id }
    });

    if (existing) {
      return res.status(400).json({ message: 'Slot already booked' });
    }

    appointment.date = newDate;
    await appointment.save();

    res.json({ message: 'Appointment rescheduled successfully', appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get logged-in patient's appointments
// @route   GET /api/appointments/patient
// @access  Private (patient)
const getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate('doctor', 'name email')
      .sort({ date: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get logged-in doctor's appointments
// @route   GET /api/appointments/doctor
// @access  Private (doctor)
const getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user._id })
      .populate('patient', 'name email')
      .sort({ date: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all appointments (for receptionist/admin overview)
// @route   GET /api/appointments/all
// @access  Private (receptionist, admin)
const getAllAppointments = async (req, res) => {
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

// @desc    Update appointment status (doctor)
// @route   PUT /api/appointments/:id
// @access  Private (doctor)
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    appointment.status = status;
    await appointment.save();

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get doctors list with average rating
// @route   GET /api/appointments/doctors
// @access  Private
const getDoctorsWithRatings = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' })
      .select('name email averageRating');

    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get patient's completed appointments without feedback
// @route   GET /api/appointments/completed-without-feedback
// @access  Private (patient)
const getCompletedAppointmentsWithoutFeedback = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patient: req.user._id,
      status: 'completed'
    }).populate('doctor', 'name');

    const Feedback = require('../models/Feedback');

    const withFeedback = await Feedback.find({
      appointment: { $in: appointments.map(a => a._id) }
    }).distinct('appointment');

    const filtered = appointments.filter(
      a => !withFeedback.includes(a._id.toString())
    );

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  bookAppointment,
  receptionistBookAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  getAllAppointments,
  updateAppointmentStatus,
  getDoctorsWithRatings,
  getCompletedAppointmentsWithoutFeedback
};