const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donorName: {
    type: String,
    required: true
  },
  donorEmail: {
    type: String,
    required: true
  },
  donorPhone: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  donationType: {
    type: String,
    enum: ['one-time', 'monthly', 'quarterly', 'yearly'],
    default: 'one-time'
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Bank Transfer', 'Cash'],
    required: true
  },
  paymentInfo: {
    type: Object,
    default: null
  },
  transactionId: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  receipt: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Donation', donationSchema);
