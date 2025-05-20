const jwt = require('jsonwebtoken');
const config = require('../config');
const { ApiError } = require('./error');

/**
 * Middleware to authenticate JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateJWT = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, config.JWT.secret);
    
    // Add user info to request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new ApiError(401, 'Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new ApiError(401, 'Token expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware to check if user has required role
 * @param {Array} roles - Array of allowed roles
 * @returns {Function} Middleware function
 */
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Not authorized to access this resource'));
    }

    next();
  };
};

module.exports = {
  authenticateJWT,
  authorizeRoles
};