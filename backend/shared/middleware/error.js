/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Handle 404 not found errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Not found - ${req.originalUrl}`);
  next(error);
};

/**
 * Error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  let error = err;
  
  // If it's not an ApiError, convert it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, false, err.stack);
  }

  // Set response status code
  res.status(error.statusCode || 500);

  // Send error response
  res.json({
    success: false,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });

  // Log error for non-operational errors
  if (!error.isOperational) {
    console.error('ERROR:', error);
  }
};

module.exports = {
  ApiError,
  notFoundHandler,
  errorHandler
};
