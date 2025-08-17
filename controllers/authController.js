// controllers/authController.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Enquiry = require("../models/Enquiry");
const GeneralLead = require('../models/GenralLead');
const Demo = require('../models/Demo');

/* ───────── JWT Helper ───────── */
const sendToken = (user, statusCode, res) => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn });

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

/* ───────── REGISTER ───────── */
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, phone, course, university, qualification, experience, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const nowUTC = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const createdAtIST = new Date(nowUTC.getTime() + istOffset);

    const newUser = new User({
      name,
      email,
      phone,
      course,
      university,
      qualification,
      experience,
      passwordHash,
      createdAt: createdAtIST
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
      createdAt: createdAtIST
    });
    await newLead.save();

    res.status(201).json({
      success: true,
      message: 'User registered and lead captured',
      user: newUser
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ───────── LOGIN ───────── */
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

    const nowUtc = new Date();
    const nowIST = new Date(nowUtc.getTime() + (5.5 * 60 * 60 * 1000));
    user.lastLogin = nowIST; 
    await user.save();

    sendToken(user, 200, res);
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

/* ───────── LOGOUT ───────── */
exports.logout = (_, res) => {
  const istTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) })
    .json({ success: true, message: 'Logged out', logoutAt: istTime });
};

/* ───────── GENERAL LEAD ───────── */
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

/* ───────── DEMO REQUEST ───────── */
exports.createDemoRequest = async (req, res) => {
  try {
    const { name, email, phone, city, course, type } = req.body;
    if (!name || !email || !phone || !city || !course || !type) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const demoRequest = new Demo({ name, email, phone, city, course, type });
    await demoRequest.save();

    const istTime = new Date(demoRequest.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    res.status(201).json({ success: true, message: "Booking request submitted successfully", data: { ...demoRequest.toObject(), createdAtIST: istTime } });
  } catch (error) {
    console.error("Error saving demo request:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ───────── UNIVERSAL ENQUIRY ───────── */
exports.createEnquiry = async (req, res) => {
  try {
    const { name, email, phone, course, university, message } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: "Name, email, and phone are required" });
    }

    const newEnquiry = new Enquiry({
      name,
      email,
      phone,
      course: course,         
      university: university, 
      message,
      status: "pending",
    });

    await newEnquiry.save();
    res.status(201).json({ success: true, message: "Enquiry submitted successfully", enquiry: newEnquiry });
  } catch (error) {
    console.error("❌ Enquiry Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while saving enquiry" });
  }
};
