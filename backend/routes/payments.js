const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Donation = require('../models/Donation');

// Ensure env keys are set
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET } = process.env;
if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.warn('Razorpay keys not set. Payment create/verify endpoints will fail until RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are provided in env.');
}

const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID || '', key_secret: RAZORPAY_KEY_SECRET || '' });

// Create an order for a pending donation
router.post('/create-order', async (req, res) => {
  try {
    const { transactionId } = req.body;
    if (!transactionId) return res.status(400).json({ success: false, message: 'transactionId required' });

    const donation = await Donation.findOne({ transactionId });
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });

    // Create Razorpay order
    const orderOptions = {
      amount: Math.round(donation.amount * 100), // paise
      currency: 'INR',
      receipt: donation.transactionId,
      notes: {
        transactionId: donation.transactionId,
        donorEmail: donation.donorEmail || ''
      }
    };

    const order = await razorpay.orders.create(orderOptions);
    return res.json({ success: true, order, key: RAZORPAY_KEY_ID });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

// Verify payment (frontend can call this after checkout for immediate UX)
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
    }

    const generatedSignature = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET || '')
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    // Fetch order to get transactionId from receipt/notes
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const transactionId = order?.receipt || order?.notes?.transactionId;
    if (!transactionId) return res.status(400).json({ success: false, message: 'Transaction mapping failed' });

    const donation = await Donation.findOne({ transactionId });
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });

    donation.status = 'completed';
    donation.receipt = razorpay_payment_id;
    donation.paymentInfo = { razorpay_order_id, razorpay_payment_id };
    await donation.save();

    return res.json({ success: true, message: 'Payment verified and donation completed' });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// Webhook endpoint for Razorpay events
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const raw = req.rawBody;
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
      .update(raw)
      .digest('hex');

    if (signature !== expected) {
      console.warn('Invalid webhook signature');
      return res.status(400).send('invalid signature');
    }

    const event = req.body;
    const eventName = event.event;

    if (eventName === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const transactionId = payment?.notes?.transactionId || payment?.order_id || null;
      // Try to fetch order to map transactionId if needed
      let trx = transactionId;
      if (!trx && payment.order_id) {
        try {
          const order = await razorpay.orders.fetch(payment.order_id);
          trx = order.receipt || order.notes?.transactionId;
        } catch (err) {
          console.warn('Failed to fetch order during webhook mapping', err.message);
        }
      }

      if (trx) {
        const donation = await Donation.findOne({ transactionId: trx });
        if (donation) {
          donation.status = 'completed';
          donation.receipt = payment.id;
          donation.paymentInfo = payment;
          await donation.save();
        }
      }
    }

    // Respond 200 to acknowledge
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('server error');
  }
});

module.exports = router;
