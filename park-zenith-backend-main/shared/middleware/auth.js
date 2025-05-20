
const jwt = require('jsonwebtoken');
const config = require('../config');

// Middleware to verify JWT token
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const user = jwt.verify(token, config.JWT.secret);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Middleware for role-based access control
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = {
  authenticateJWT,
  authorize,
};
