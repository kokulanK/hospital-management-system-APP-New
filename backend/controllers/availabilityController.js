const Availability = require('../models/Availability');

// @desc    Add a new availability slot
// @route   POST /api/availability
// @access  Private (doctor only)
const addAvailability = async (req, res) => {
  try {
    const { startTime, endTime } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({ message: 'Start and end times are required' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ message: 'Start time must be before end time' });
    }

    const diffMinutes = (end - start) / (1000 * 60);
    if (diffMinutes < 15) {
      return res.status(400).json({ message: 'Availability must be at least 15 minutes long' });
    }

    // Check for overlapping availability
    const overlapping = await Availability.findOne({
      doctor: req.user._id,
      $or: [
        { startTime: { $lt: end, $gte: start } },
        { endTime: { $gt: start, $lte: end } },
        { startTime: { $lte: start }, endTime: { $gte: end } }
      ]
    });

    if (overlapping) {
      return res.status(400).json({ message: 'Overlapping availability exists' });
    }

    const availability = await Availability.create({
      doctor: req.user._id,
      startTime: start,
      endTime: end
    });

    res.status(201).json(availability);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all availability for logged-in doctor
// @route   GET /api/availability
// @access  Private (doctor)
const getMyAvailability = async (req, res) => {
  try {
    const availabilities = await Availability.find({ doctor: req.user._id }).sort({ startTime: 1 });
    res.json(availabilities);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete availability
// @route   DELETE /api/availability/:id
// @access  Private (doctor)
const deleteAvailability = async (req, res) => {
  try {
    const availability = await Availability.findById(req.params.id);
    if (!availability) {
      return res.status(404).json({ message: 'Availability not found' });
    }
    if (availability.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await availability.deleteOne();
    res.json({ message: 'Availability removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get available slots for a doctor on a specific date (for patients)
// @route   GET /api/availability/doctor/:doctorId?date=YYYY-MM-DD
// @access  Private (any authenticated)
const getDoctorSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Find all availability for that doctor on that day
    const availabilities = await Availability.find({
      doctor: doctorId,
      startTime: { $gte: startOfDay, $lte: endOfDay }
    });

    // Fetch all appointments for that doctor on that day
    const Appointment = require('../models/Appointment');
    const appointments = await Appointment.find({
      doctor: doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    });

    // Generate 15-minute slots within each availability
    let slots = [];
    const slotDuration = 15; // minutes

    availabilities.forEach(av => {
      let slotStart = new Date(av.startTime);
      const slotEnd = new Date(av.endTime);

      while (slotStart < slotEnd) {
        const slotEndTime = new Date(slotStart.getTime() + slotDuration * 60000);
        if (slotEndTime > slotEnd) break;

        const isBooked = appointments.some(apt => {
          const aptStart = new Date(apt.date);
          return aptStart.getTime() === slotStart.getTime();
        });

        if (!isBooked) {
          slots.push({
            start: new Date(slotStart),
            end: slotEndTime
          });
        }

        slotStart = slotEndTime;
      }
    });

    slots.sort((a, b) => a.start - b.start);
    res.json(slots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  addAvailability,
  getMyAvailability,
  deleteAvailability,
  getDoctorSlots
};