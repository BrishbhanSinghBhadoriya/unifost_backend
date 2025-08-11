const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Lead = require('../models/Lead');
const GeneralLead = require('../models/GenralLead');

/* ─────────✅ UTIL TO SIGN & RETURN JWT ───────── */
const sendToken = (user, statusCode, res) => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn,
  });

  const cookieExpiration = expiresIn.includes('d')
    ? parseInt(expiresIn) * 24 * 60 * 60 * 1000
    : 24 * 60 * 60 * 1000;

  res.status(statusCode)
    .cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: cookieExpiration,
    })
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        course: user.course,
        university: user.university,
      },
    });
};

/* ─────────✅ REGISTER ───────── */
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      name,
      email,
      phone,
      course,
      university,
      qualification,
      experience,
      password,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      phone,
      course,
      university,
      qualification,
      experience,
      passwordHash,
    });
    await newUser.save();

    const newLead = new Lead({
      name,
      email,
      phone,
      course,
      university,
      qualification, 
      experience,
    });
    await newLead.save();


res.status(201).json({
  success: true,
  message: 'User registered and lead captured',
  user: {
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    phone: newUser.phone,
    course: newUser.course,
    university: newUser.university,
    qualification: newUser.qualification,
    experience: newUser.experience,
  }
});
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ─────────✅ LOGIN ───────── */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact support.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    sendToken(user, 200, res);
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

/* ─────────✅ LOGOUT ───────── */
exports.logout = (_, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) })
    .json({ success: true, message: 'Logged out' });
};


// controllers/authController.js

 

exports.createGeneralLead = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const lead = new GeneralLead({ name, email, phone, message });
    await lead.save();

    res.status(201).json({ success: true, message: "Lead submitted successfully" });
  } catch (error) {
    console.error("Error saving general lead:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

