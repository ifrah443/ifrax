const express = require('express');
const router = express.Router();
const Rickshaw = require('../models/Rickshaw');
const { isAuthenticated } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const path = require('path');
const multer = require('multer');

const fs = require('fs');


const uploadDir = path.join(__dirname, './public/uploads');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

router.get('/', isAuthenticated, (req, res) => res.render('vehicles', { title: 'Rickshaw Registry' }));
// 📷 Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    ext && mime ? cb(null, true) : cb(new Error('Only JPEG, PNG, or WebP images allowed'));
  }
});
router.get('/register', isAuthenticated, (req, res) => res.render('register', { title: 'Register Rickshaw' }));

// 📥 POST: Register Rickshaw
router.post('/register', isAuthenticated, upload.single('vehicleImage'), async (req, res) => {
  
  try {
    const { licensePlate, ownerName, phoneNumber, make, year } = req.body;
    
    if (!licensePlate || !ownerName || !make || !year) {
      console.log('Missing fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const rickshaw = new Rickshaw({
      licensePlate,
      ownerName,
      phoneNumber,
      make,
      year: parseInt(year),
      image: imagePath
    });

    await rickshaw.save();
    res.status(201).json({ message: 'Rickshaw registered successfully!', rickshaw });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'License plate already registered' });
    res.status(500).json({ error: err.message });
  }
});

// ✅ Payment route - MUST be in server.js
router.post('/api/rickshaws/:id/pay', isAuthenticated, async (req, res) => {
  console.log('💰 POST /api/rickshaws/:id/pay hit!', req.params.id, req.body);
  
  try {
    const { amount, description } = req.body;
    
    // 1. Validation
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Valid payment amount required (must be > 0)' });
    }

    const rickshaw = await Rickshaw.findById(req.params.id);
    if (!rickshaw) {
      return res.status(404).json({ error: 'Rickshaw not found' });
    }

    const paymentAmount = parseFloat(amount);

    // 2. Create the Transaction Record first
    const newTransaction = await Transaction.create({
      rickshawId: rickshaw._id, 
      type: 'payment',
      amount: paymentAmount,
      description: description?.trim() || 'Manual payment',
      date: new Date()
    });

    // 3. Update the Rickshaw balance only if transaction creation succeeded
    rickshaw.balance = (rickshaw.balance || 0) - paymentAmount;
    await rickshaw.save();

    // 4. Success Response
    res.status(201).json({ 
      message: 'Payment recorded successfully', 
      transaction: {
        _id: newTransaction._id,
        rickshawId: rickshaw._id,
        type: 'payment',
        amount: paymentAmount,
        newBalance: rickshaw.balance
      }
    });

  } catch (err) {
    console.error('💥 Payment route error:', err);
    // If it's a validation error, let's send a cleaner message
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// ✅ Allow askeri, admin, AND registrar to view vehicles
router.get('/view', isAuthenticated,  
  requireRole('askeri', 'admin', 'registrar'),
  (req, res) => {
    res.render('view', { 
      title: 'Raadi bajaaj',
      // Optional: pass role-specific data
      canEdit: ['admin', 'registrar'].includes(req.session.user?.role),
      canDelete: req.session.user?.role === 'admin'
    });
  }
);
// GET: Render all rickshaws in a table
router.get('/all-vehicles', isAuthenticated,   requireRole('admin', 'registrar'),
 async (req, res) => {
  try {
    // Fetch all, sort by newest first
    const rickshaws = await Rickshaw.find().sort({ createdAt: -1 });
    res.render('all-vehicles', { title: 'All Registered Rickshaws', rickshaws });
  } catch (err) {
    console.error('❌ Error loading vehicles:', err);
    res.status(500).send('Failed to load vehicle list');
  }
});
// GET: Render a single rickshaw page (server-side, no JS)
router.get('/rickshaw/:plate', isAuthenticated, async (req, res) => {
  try {
    const plate = req.params.plate.trim().toUpperCase();
    
    const rickshaw = await Rickshaw.findOne({ licensePlate: plate });
    if (!rickshaw) {
      return res.status(404).send(`
        <div class="container">
          <h1>Rickshaw Not Found</h1>
          <p>No rickshaw with plate "${plate}" exists.</p>
          <a href="/" class="btn btn-secondary">← Back Home</a>
        </div>
      `);
    }

    // Render the clean, static view page
    res.render('rickshaw', { 
      title: `Rickshaw • ${rickshaw.licensePlate}`,
      rickshaw 
    });
    
  } catch (err) {
    console.error('❌ Error loading rickshaw:', err);
    res.status(500).send('Failed to load rickshaw details');
  }
});


// GET single rickshaw by license plate
router.get('/api/rickshaws/search', isAuthenticated, async (req, res) => {
  try {
    const plate = req.query.plate?.trim().toUpperCase();
    if (!plate) return res.status(400).json({ error: 'License plate is required' });

    const rickshaw = await Rickshaw.findOne({ licensePlate: plate });
    if (!rickshaw) return res.status(404).json({ error: 'Rickshaw not found' });

    res.json(rickshaw);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




module.exports = router;