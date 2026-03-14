const express = require('express');
const router = express.Router();
const Volunteer = require('../models/Volunteer');
const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Register volunteer
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, city, state, education, profession, experience, skills, area, availability, agreeToTerms } = req.body;

    const existingVolunteer = await Volunteer.findOne({ email });
    if (existingVolunteer) {
      return res.status(400).json({ success: false, message: 'Volunteer already registered' });
    }

    const volunteer = new Volunteer({
      firstName,
      lastName,
      email,
      phone,
      city,
      state,
      education,
      profession,
      experience,
      skills,
      area,
      availability,
      agreeToTerms,
      status: 'pending'
    });

    await volunteer.save();

    // Send email notification to rolwynmartis03@gmail.com
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'rolwynmartis03@gmail.com',
        subject: 'New Volunteer Registration - Yashwant Rural Development Society',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
              New Volunteer Registration
            </h2>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #27ae60; margin-top: 0;">Personal Information</h3>
              <p><strong>Name:</strong> ${firstName} ${lastName}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phone}</p>
              <p><strong>Location:</strong> ${city}, ${state}</p>
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #e74c3c; margin-top: 0;">Professional Details</h3>
              <p><strong>Education:</strong> ${education}</p>
              <p><strong>Profession:</strong> ${profession}</p>
              <p><strong>Experience:</strong> ${experience}</p>
              <p><strong>Skills:</strong> ${skills.join(', ')}</p>
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #9b59b6; margin-top: 0;">Volunteer Preferences</h3>
              <p><strong>Preferred Area:</strong> ${area}</p>
              <p><strong>Availability:</strong> ${availability}</p>
              <p><strong>Terms Agreed:</strong> ${agreeToTerms ? 'Yes' : 'No'}</p>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>Action Required:</strong> Please review this volunteer application and contact them if approved.
              </p>
            </div>

            <p style="color: #7f8c8d; font-size: 12px; text-align: center; margin-top: 30px;">
              This email was sent from the Yashwant Rural Development Society volunteer registration system.
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('Volunteer registration email sent successfully');
    } catch (emailError) {
      console.error('Failed to send volunteer registration email:', emailError);
      // Don't fail the registration if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Volunteer registration successful. Awaiting approval.',
      data: volunteer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all volunteers
router.get('/', async (req, res) => {
  try {
    const volunteers = await Volunteer.find({ status: 'active' });
    res.json({ success: true, data: volunteers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get volunteer stats
router.get('/stats', async (req, res) => {
  try {
    const active = await Volunteer.countDocuments({ status: 'active' });
    const pending = await Volunteer.countDocuments({ status: 'pending' });
    const total = await Volunteer.countDocuments();

    res.json({
      success: true,
      data: { totalVolunteers: total, active, pending }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
