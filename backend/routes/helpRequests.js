const express = require('express');
const router = express.Router();
const HelpRequest = require('../models/HelpRequest');

// Create help request
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, state, city, disasterType, helpNeeded, description, familySize } = req.body;

    const helpRequest = new HelpRequest({
      firstName,
      lastName,
      email,
      phone,
      state,
      city,
      disasterType,
      helpNeeded,
      description,
      familySize,
      status: 'submitted'
    });

    await helpRequest.save();
    res.status(201).json({
      success: true,
      message: 'Help request submitted successfully',
      data: helpRequest
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all help requests
router.get('/', async (req, res) => {
  try {
    const requests = await HelpRequest.find().sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update help request status
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const helpRequest = await HelpRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, data: helpRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
