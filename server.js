require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const Rickshaw = require('./models/Rickshaw');
const path = require('path');
const Transaction = require('./models/Transaction'); // ✅ ADD THIS LINE
const initCronJobs = require('./config/cron');
const { requireRole, isAuthenticated } = require('./middleware/auth');
const vehiclesRouter = require('./routes/vehicles');
const authRouter = require('./routes/auth');

const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
// 3. Flash Middleware (MUST be second)
app.use(flash());
const uploadDir = path.join(__dirname, './public/uploads');

// This middleware passes flash messages to the view engine
app.use((req, res, next) => {
  res.locals.error_msg = req.flash('error');
  res.locals.success_msg = req.flash('success');
  // Also helpful to pass the user object if they are logged in
  res.locals.user = req.session.user || null;
  next();
});
app.use(express.json()); // 👈 Parses JSON bodies like {"amount": 10}
// 🔌 MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    initCronJobs(); // Now this will run correctly after connection
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });

// 🎨 View Engine & Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));



//routes
app.use('/vehicles', vehiclesRouter);
app.use('/auth', authRouter);
app.use('/admin', require('./routes/admin'));





// 📍 View Routes
app.get('/', (req, res) => res.render('Login', { title: 'Rickshaw Registry' }));
app.get('/landing', isAuthenticated, requireRole('admin', 'registrar'), (req, res) => res.render('Landing', { title: 'Vehicle Managment' }));





// 🚀 Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));