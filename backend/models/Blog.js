const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Disaster Alert', 'NGO Activity', 'Awareness', 'Press Release', 'Event'],
    required: true
  },
  author: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: null
  },
  excerpt: {
    type: String,
    required: true
  },
  tags: [String],
  views: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Blog', blogSchema);
