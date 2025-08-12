require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./Config/db');
const errorHandler = require('./Middleware/errorHandler');


// Import routes
const authRoutes = require('./routes/authRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const leadRoutes = require('./routes/LeadRoutes');
const healthRoutes = require('./routes/healthRoutes');
const openaiRoutes = require('./routes/openaiRoutes');

// Setup
const app = express();
const PORT = process.env.PORT || 5001;

// Allowed origins for CORS
const allowedOrigins = [
  'https://unifostedu.com',
  'http://unifostedu.com',
  'http://localhost:3000'
];

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Dynamic CORS handling
app.use(cors({
  origin: function (origin, callback) {
    // Allow no-origin requests (Postman, curl) or matching origins
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));

// Dev logging
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/enquiry', enquiryRoutes);
app.use('/api/leads', leadRoutes);
app.use('/health', healthRoutes);
app.use('/api/openai', openaiRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({ status: 'API is running ✅' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

// DB + Server start
const startServer = async () => {
  try {
    await connectDB();

    // Use 0.0.0.0 for Render hosting
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n✅ Server is running on port ${PORT}`);
    });

  } catch (err) {
    console.error('❌ Server start error:', err);
    process.exit(1);
  }
};

startServer();
