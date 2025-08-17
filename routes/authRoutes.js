const express = require('express');
const { body } = require('express-validator');
const { register, login, logout, createGeneralLead, createDemoRequest, createEnquiry } = require('../controllers/authController');
const router = express.Router();

// Validation rules for registration
const registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').isMobilePhone().withMessage('Valid phone number is required'),
  body('course').notEmpty().withMessage('Course is required'),
  body('university').notEmpty().withMessage('University is required'),
  body('qualification').notEmpty().withMessage('Qualification is required'),
  body('experience').notEmpty().withMessage('Experience is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', login);
router.post('/logout', logout);
router.post("/generallead", createGeneralLead);
router.post('/demo', createDemoRequest);
router.post("/enquiry", createEnquiry);   // ✅ Universal Enquiry Route

module.exports = router;
