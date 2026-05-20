// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); 

const userSchema = new mongoose.Schema({
  // 🔑 NEW: Username for login (unique, required)
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [50, 'Username cannot exceed 50 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  
  // 👤 Optional: Full name for display purposes
  fullName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  employeeId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    match: [/^EMP-\d{3,6}$/, 'Format: EMP-XXX']
  },
  
  role: {
    type: String,
    required: true,
    enum: ['admin', 'registrar', 'askeri'],
    default: 'registrar'
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Exclude from queries by default
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  lastLogin: Date
}, {
  timestamps: true
});


// 🔍 Compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 🛡️ Permission helper
userSchema.methods.can = function(action) {
  const roles = {
    admin: ['all'],
    registrar: ['vehicle:create', 'vehicle:read', 'vehicle:update', 'finance:read'],
    askeri: ['vehicle:read', 'vehicle:check_status']
  };
  const permissions = roles[this.role] || [];
  return permissions.includes('all') || permissions.includes(action);
};

// 🔎 Index for faster login lookups
userSchema.index({ username: 1 });

module.exports = mongoose.model('User', userSchema);