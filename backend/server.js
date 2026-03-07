const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
require('dotenv').config();

// Import security utilities
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { apiLimiter, authLimiter } = require('./middleware/rateLimitMiddleware');

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security Middleware - Order matters!
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
app.use('/api/', apiLimiter);

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price']
}));

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Body parsing with size limits
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    // Raw body for webhook verification if needed
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files with security headers
app.use(express.static(path.join(__dirname, '../frontend'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Security headers for all routes
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Remove server information
  res.removeHeader('X-Powered-By');

  next();
});

// Database Connection with security
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}).then(() => {
  console.log('✅ MongoDB Connected Securely');
}).catch(err => {
  console.error('❌ MongoDB Connection Error:', err.message);
  process.exit(1);
});

// Request logging (remove sensitive data)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Routes
app.use('/api/donations', require('./routes/donations'));
app.use('/api/volunteers', require('./routes/volunteers'));
app.use('/api/help-requests', require('./routes/helpRequests'));
app.use('/api/blog', require('./routes/blog'));
app.use('/api/payments', require('./routes/payments'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    message: 'Server is running',
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Security test endpoint (remove in production)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/security-test', (req, res) => {
    res.json({
      message: 'Security headers active',
      headers: {
        'Content-Security-Policy': res.getHeader('Content-Security-Policy'),
        'X-Frame-Options': res.getHeader('X-Frame-Options'),
        'X-Content-Type-Options': res.getHeader('X-Content-Type-Options')
      }
    });
  });
}

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🔒 Secure server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5000'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Unhandled Rejection: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
