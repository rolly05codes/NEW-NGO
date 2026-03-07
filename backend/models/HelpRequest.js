const mongoose = require('mongoose');

const helpRequestSchema = new mongoose.Schema({
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
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  disasterType: {
    type: String,
    enum: ['Earthquake', 'Flood', 'Cyclone', 'Drought', 'Tsunami', 'Fire', 'Other'],
    required: true
  },
  helpNeeded: [String],
  description: {
    type: String,
    required: true
  },
  familySize: {
    type: Number,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['submitted', 'reviewing', 'approved', 'in-progress', 'completed'],
    default: 'submitted'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('HelpRequest', helpRequestSchema);
