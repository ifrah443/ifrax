const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcrypt'); 
router.get('/register', (req, res) => {
  res.render('userRegistration', { 
    title: 'Register Employee',
    error: null,    // Provide a default value
    success: null,  // Provide a default value
    formData: {}    // Provide an empty object for formData?.fullName
  });
});
// 📥 POST: Register New Employee/User
router.post('/register', async (req, res) => {
  try {
     const { username, fullName, role, password, confirmPassword } = req.body;
    // 1. Basic Validation
    if (password !== confirmPassword) {
      return res.render('userRegistration', {
        title: 'Register Employee',
        error: 'Passwords do not match.',
        success: null,
        formData: req.body
      });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ fullName });
    if (existingUser) {
      return res.render('userRegistration', {
        title: 'Register Employee',
        error: 'A user with this name already exists.',
        success: null,
        formData: req.body
      });
    }

    // --- NEW EMPLOYEE ID LOGIC ---
    // 3. Generate Employee ID (EMP-001 format)
    let nextId = 'EMP-001';
    const lastUser = await User.findOne().sort({ createdAt: -1 });

    if (lastUser && lastUser.employeeId) {
      // Extract the number from 'EMP-001' (the 001 part)
      const lastIdNumber = parseInt(lastUser.employeeId.split('-')[1]);
      const newIdNumber = lastIdNumber + 1;
      // Pad with zeros to keep the 00X format
      nextId = `EMP-${newIdNumber.toString().padStart(3, '0')}`;
    }
    // ------------------------------

    // 4. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create and Save User
    const newUser = new User({
      username,
      fullName,
      role,
      password: hashedPassword,
      employeeId: nextId // Explicitly setting the ID here
    });

    await newUser.save();

    // 6. Success Response
    res.render('userRegistration', {
      title: 'Register Employee',
      error: null,
      success: `Account created successfully! Employee ID: ${nextId}`,
      formData: {} 
    });

  } catch (err) {
    console.error('💥 Registration Error:', err);
    res.status(500).render('userRegistration', {
      title: 'Register Employee',
      error: err.message || 'Internal Server Error',
      success: null,
      formData: req.body
    });
  }
});
// routes/auth.js - Login route example
// routes/auth.js - POST /login (HTML Form Flow)
router.post('/login', async (req, res) => {
  try {
    // ✅ 1. Get username (not employeeId) from form
    const { username, password } = req.body;

    // ✅ 2. Basic validation
    if (!username || !password) {
      req.flash('error', 'Username and password are required.');
      return res.redirect('/login');
    }

    // ✅ 3. Find user by username (and include password field)
    const user = await User.findOne({ username }).select('+password');
    
    // ✅ 4. Check if user exists AND is active
    if (!user || !user.isActive) {
      req.flash('error', 'Invalid username or password.');
      return res.redirect('/vehicles/view');
    }

    // ✅ 5. Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash('error', 'Invalid username or password.');
      return res.redirect('/login');
    }

    // ✅ 6. Attach user to session (for middleware)
    req.session.user = {
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      employeeId: user.employeeId,
      role: user.role
      // Optional: add permissions if you use them in middleware
      // permissions: user.permissions || []
    };

    // ✅ 7. Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // ✅ 8. Flash success message
    req.flash('success', `Welcome back, ${user.fullName || user.username}!`);

    // ✅ 9. Redirect based on role
    if (user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    } else if (user.role === 'registrar') {
      return res.redirect('/landing'); // or your registrar homepage
    } else if (user.role === 'askeri') {
      return res.redirect('/vehicles/view'); // Askari's plate lookup page
    }

    // Default fallback
    res.redirect('/');

  } catch (error) {
    console.error('💥 Login Error:', error);
    req.flash('error', 'Login failed. Please try again.');
    res.redirect('/login');
  }
});





module.exports = router;