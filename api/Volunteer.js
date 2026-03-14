const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  education: {
    type: String,
    required: true
  },
  profession: {
    type: String,
    required: true
  },
  experience: {
    type: String,
    required: true
  },
  skills: [String],
  area: {
    type: String,
    enum: ['Medical', 'Search & Rescue', 'Distribution', 'Rehabilitation', 'Education', 'Other'],
    required: true
  },
  availability: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Emergency Only'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'inactive'],
    default: 'pending'
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  agreeToTerms: {
    type: Boolean,
    required: true
  }
});

module.exports = mongoose.model('Volunteer', volunteerSchema);
