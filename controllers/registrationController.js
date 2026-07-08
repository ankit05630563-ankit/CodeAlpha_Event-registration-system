const mongoose = require('mongoose');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

// @desc    Register the logged-in user for an event
// @route   POST /api/registrations
// @body    { eventId }
// @access  Private
const createRegistration = async (req, res) => {
  const { eventId } = req.body;

  if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ message: 'A valid eventId is required' });
  }

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.registeredCount >= event.capacity) {
      return res.status(400).json({ message: 'This event is already full' });
    }

    // Check for an existing active registration for this user/event
    const existing = await Registration.findOne({
      user: req.user._id,
      event: eventId,
      status: 'confirmed',
    });

    if (existing) {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }

    // If a previous cancelled registration exists, reactivate it; otherwise create new
    let registration = await Registration.findOne({ user: req.user._id, event: eventId });

    if (registration) {
      registration.status = 'confirmed';
      await registration.save();
    } else {
      registration = await Registration.create({
        user: req.user._id,
        event: eventId,
        status: 'confirmed',
      });
    }

    event.registeredCount += 1;
    await event.save();

    const populated = await registration.populate('event', 'title date location');

    return res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }
    return res.status(500).json({ message: 'Server error creating registration', error: error.message });
  }
};

// @desc    Get all registrations for the logged-in user
// @route   GET /api/registrations/my
// @access  Private
const getMyRegistrations = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { user: req.user._id };
    if (status) query.status = status;

    const registrations = await Registration.find(query)
      .populate('event', 'title description date location capacity registeredCount')
      .sort({ createdAt: -1 });

    return res.status(200).json(registrations);
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching registrations', error: error.message });
  }
};

// @desc    Get a single registration by ID (must belong to the user)
// @route   GET /api/registrations/:id
// @access  Private
const getRegistrationById = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id).populate(
      'event',
      'title description date location capacity registeredCount'
    );

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (registration.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this registration' });
    }

    return res.status(200).json(registration);
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching registration', error: error.message });
  }
};

// @desc    Cancel the logged-in user's registration
// @route   DELETE /api/registrations/:id
// @access  Private
const cancelRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (registration.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this registration' });
    }

    if (registration.status === 'cancelled') {
      return res.status(400).json({ message: 'Registration is already cancelled' });
    }

    registration.status = 'cancelled';
    await registration.save();

    await Event.findByIdAndUpdate(registration.event, {
      $inc: { registeredCount: -1 },
    });

    return res.status(200).json({ message: 'Registration cancelled successfully', registration });
  } catch (error) {
    return res.status(500).json({ message: 'Server error cancelling registration', error: error.message });
  }
};

module.exports = {
  createRegistration,
  getMyRegistrations,
  getRegistrationById,
  cancelRegistration,
};
