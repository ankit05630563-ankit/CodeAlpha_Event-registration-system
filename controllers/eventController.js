const Event = require('../models/Event');

// @desc    Get list of all events (supports simple search/pagination)
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const events = await Event.find(query)
      .sort({ date: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Event.countDocuments(query);

    return res.status(200).json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      events,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching events', error: error.message });
  }
};

// @desc    Get single event details
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    return res.status(200).json(event);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    return res.status(500).json({ message: 'Server error fetching event', error: error.message });
  }
};

// @desc    Create a new event
// @route   POST /api/events
// @access  Private (admin)
const createEvent = async (req, res) => {
  try {
    const { title, description, date, location, capacity } = req.body;

    if (!title || !description || !date || !location || !capacity) {
      return res.status(400).json({ message: 'All event fields are required' });
    }

    const event = await Event.create({
      title,
      description,
      date,
      location,
      capacity,
      createdBy: req.user._id,
    });

    return res.status(201).json(event);
  } catch (error) {
    return res.status(500).json({ message: 'Server error creating event', error: error.message });
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private (admin)
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const updatable = ['title', 'description', 'date', 'location', 'capacity'];
    updatable.forEach((field) => {
      if (req.body[field] !== undefined) event[field] = req.body[field];
    });

    const updatedEvent = await event.save();
    return res.status(200).json(updatedEvent);
  } catch (error) {
    return res.status(500).json({ message: 'Server error updating event', error: error.message });
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private (admin)
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await event.deleteOne();
    return res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error deleting event', error: error.message });
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};
