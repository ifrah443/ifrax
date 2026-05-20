// models/Rickshaw.js
const mongoose = require('mongoose');

const rickshawSchema = new mongoose.Schema({
  licensePlate: { type: String, required: true, unique: true, trim: true, uppercase: true },
  ownerName: { type: String, required: true },
  phoneNumber: { type: String },
  make: { type: String, required: true },
  year: { type: Number, required: true, min: 1900, max: 2030 },
  image: { type: String },
  registrationDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  // ADD THIS:
  balance: { type: Number, default: 0 } 
}, { timestamps: true });

module.exports = mongoose.model('Rickshaw', rickshawSchema);