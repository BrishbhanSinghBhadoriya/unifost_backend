const mongoose = require('mongoose');

const demoSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  course: { type: String, required: true, trim: true },
  type: { type: String, required: true, enum: ['video', 'home'] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Demo', demoSchema);
