// routes/admin.js
const express = require('express');
const router = express.Router(); //Muhiim: creates router instance
const User = require('../models/User');
const { requireRole, isAuthenticated } = require('../middleware/auth');

// GET: Render Admin Dashboard
router.get('/dashboard', isAuthenticated, requireRole('admin'), async (req, res) => {
  try {
    // Fetch all users for the admin table (exclude passwords)
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      users,
      error: null,
      success: req.flash('success'),
      errorFlash: req.flash('error')
    });
  } catch (err) {
    console.error('❌ Admin dashboard error:', err);
    res.status(500).render('admin/dashboard', {
      title: 'Admin Dashboard',
      users: [],
      error: 'Failed to load user data',
      success: null,
      errorFlash: null
    });
  }
});


module.exports = router;