const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
    },
  },
  { timestamps: true }
);

// Prevent a user from registering for the same event twice while active
registrationSchema.index(
  { user: 1, event: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'confirmed' },
  }
);

module.exports = mongoose.model('Registration', registrationSchema);
