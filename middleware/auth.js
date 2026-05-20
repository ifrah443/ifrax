// middleware/auth.js

// ✅ Existing: Check if user is logged in (session-based)
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    // Store a temporary message in the session (requires connect-flash)
    req.flash('error', 'You must be logged in to view that page.');
    res.redirect('/'); // Redirect to login page
  }
};

// ✅ New: Check if user has specific role
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // First ensure user is authenticated
    if (!req.session || !req.session.user) {
      req.flash('error', 'Please log in first.');
      return res.redirect('/');
    }
    
    // Then check role
    if (!allowedRoles.includes(req.session.user.role)) {
      req.flash('error', `Access denied. Requires role: ${allowedRoles.join(', ')}`);
      return res.redirect('/'); // or render an error page
    }
    next();
  };
};

// ✅ New: Check if user has specific permission (optional but useful)
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      req.flash('error', 'Please log in first.');
      return res.redirect('/login');
    }
    
    const userPermissions = req.session.user.permissions || [];
    if (!userPermissions.includes(permission)) {
      req.flash('error', `Access denied. Requires permission: ${permission}`);
      return res.redirect('/');
    }
    next();
  };
};

// ✅ Export ALL middleware as named exports
module.exports = {
  isAuthenticated,
  requireRole,
  requirePermission
};