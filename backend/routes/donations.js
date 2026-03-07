const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const Donation = require('../models/Donation');
const { donationLimiter } = require('../middleware/rateLimitMiddleware');
const {
  sanitizeInput,
  isValidEmail,
  isValidPhone,
  isValidAmount,
  isValidName,
  containsSuspiciousContent
} = require('../utils/securityUtils');

// Input validation middleware
const validateDonation = [
  body('donorName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('donorEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  body('donorPhone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit Indian mobile number'),

  body('amount')
    .isFloat({ min: 1, max: 1000000 })
    .withMessage('Amount must be between ₹1 and ₹10,00,000'),

  body('donationType')
    .isIn(['one-time', 'monthly', 'quarterly', 'yearly'])
    .withMessage('Invalid donation type'),

  body('paymentMethod')
    .isIn(['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash'])
    .withMessage('Invalid payment method')
];

// Security middleware for all donation routes
router.use(donationLimiter);

// Create donation with security
router.post('/', validateDonation, async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { donorName, donorEmail, donorPhone, amount, donationType, paymentMethod } = req.body;

    // Additional security checks
    if (containsSuspiciousContent(donorName) ||
        containsSuspiciousContent(donorEmail) ||
        containsSuspiciousContent(donationType) ||
        containsSuspiciousContent(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input detected'
      });
    }

    // Sanitize inputs
    const sanitizedData = sanitizeInput({
      donorName,
      donorEmail,
      donorPhone,
      amount: Number(amount),
      donationType,
      paymentMethod
    });

    // Check for duplicate recent donations from same email (prevent spam)
    const recentDonation = await Donation.findOne({
      donorEmail: sanitizedData.donorEmail,
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
    });

    if (recentDonation) {
      return res.status(429).json({
        success: false,
        message: 'Please wait before making another donation'
      });
    }

    // If payment method is cash, mark completed immediately. Otherwise mark pending and return a payment URL for redirect.
    const isImmediate = (paymentMethod === 'Cash');

    const donation = new Donation({
      ...sanitizedData,
      transactionId: 'TXN-' + uuidv4(),
      status: isImmediate ? 'completed' : 'pending',
      receipt: isImmediate ? 'RCP-' + uuidv4() : null,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await donation.save();

    // Return sanitized response (don't expose sensitive data)
    const responseData = {
      id: donation._id,
      donorName: donation.donorName,
      amount: donation.amount,
      donationType: donation.donationType,
      transactionId: donation.transactionId,
      receipt: donation.receipt,
      status: donation.status,
      createdAt: donation.createdAt
    };

    // If payment is deferred, provide a payment URL for frontend redirection to complete payment.
    if (!isImmediate) {
      const paymentUrl = `${req.protocol}://${req.get('host')}/payment.html?tx=${donation.transactionId}`;
      return res.status(201).json({
        success: true,
        message: 'Redirect to payment provider',
        data: responseData,
        paymentUrl
      });
    }

    res.status(201).json({
      success: true,
      message: 'Donation received successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Donation creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all donations (admin only - add authentication later)
router.get('/', async (req, res) => {
  try {
    // Basic pagination and filtering
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const donations = await Donation.find()
      .select('-ipAddress -userAgent') // Don't expose sensitive data
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Donation.countDocuments();

    res.json({
      success: true,
      data: donations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Donation fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get donation stats (public but rate limited)
router.get('/stats', async (req, res) => {
  try {
    const total = await Donation.countDocuments({ status: 'completed' });
    const totalAmount = await Donation.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get monthly stats
    const monthlyStats = await Donation.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalDonations: total,
        totalAmount: totalAmount[0]?.total || 0,
        monthlyDonations: monthlyStats[0]?.count || 0,
        monthlyAmount: monthlyStats[0]?.amount || 0
      }
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Complete a pending donation (called by payment provider or simulated frontend)
router.post('/:transactionId/complete', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const donation = await Donation.findOne({ transactionId });
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    if (donation.status === 'completed') {
      return res.json({ success: true, message: 'Donation already completed' });
    }

    donation.status = 'completed';
    donation.receipt = donation.receipt || 'RCP-' + uuidv4();
    donation.completedAt = new Date();
    await donation.save();

    return res.json({
      success: true,
      message: 'Donation payment completed',
      data: {
        transactionId: donation.transactionId,
        receipt: donation.receipt,
        amount: donation.amount
      }
    });
  } catch (error) {
    console.error('Complete donation error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get donation by transactionId (public, non-sensitive fields)
router.get('/tx/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const donation = await Donation.findOne({ transactionId }).select('-ipAddress -userAgent -__v');
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    // Return only non-sensitive fields
    return res.json({
      success: true,
      data: {
        transactionId: donation.transactionId,
        donorName: donation.donorName,
        amount: donation.amount,
        donationType: donation.donationType,
        status: donation.status,
        createdAt: donation.createdAt,
        receipt: donation.receipt || null
      }
    });
  } catch (error) {
    console.error('Fetch donation error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
