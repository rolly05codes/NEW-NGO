const validator = require('validator');
const mongoose = require('mongoose');

// Sanitize input data
const sanitizeInput = (data) => {
  if (typeof data === 'string') {
    return validator.escape(data.trim());
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return data;
};

// Validate email
const isValidEmail = (email) => {
  return validator.isEmail(email) && validator.isLength(email, { min: 5, max: 100 });
};

// Validate phone number (Indian format)
const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// Validate amount
const isValidAmount = (amount) => {
  const numAmount = Number(amount);
  return !isNaN(numAmount) && numAmount > 0 && numAmount <= 1000000; // Max 10 lakhs
};

// Validate name
const isValidName = (name) => {
  return validator.isLength(name, { min: 2, max: 50 }) &&
         validator.matches(name, /^[a-zA-Z\s]+$/);
};

// Validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Validate URL
const isValidUrl = (url) => {
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true
  });
};

// Validate text length
const isValidTextLength = (text, min = 0, max = 1000) => {
  return validator.isLength(text, { min, max });
};

// Check for suspicious content
const containsSuspiciousContent = (text) => {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /alert\(/i,
    /document\./i,
    /window\./i
  ];

  return suspiciousPatterns.some(pattern => pattern.test(text));
};

// Rate limiting helper
const checkRateLimit = (req, res, limit, windowMs) => {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!req.rateLimit) {
    req.rateLimit = { count: 0, windowStart };
  }

  // Reset window if needed
  if (req.rateLimit.windowStart < windowStart) {
    req.rateLimit.count = 0;
    req.rateLimit.windowStart = now;
  }

  req.rateLimit.count++;

  if (req.rateLimit.count > limit) {
    return false; // Rate limit exceeded
  }

  return true; // Within limit
};

module.exports = {
  sanitizeInput,
  isValidEmail,
  isValidPhone,
  isValidAmount,
  isValidName,
  isValidObjectId,
  isValidUrl,
  isValidTextLength,
  containsSuspiciousContent,
  checkRateLimit
};