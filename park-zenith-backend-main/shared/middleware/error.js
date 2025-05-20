
// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error status and message
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  // Handle SQL/DB errors
  if (err.code && err.code.startsWith('23')) {
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({ message: 'Resource already exists' });
    }
    if (err.code === '23503') { // Foreign key violation
      return res.status(400).json({ message: 'Referenced resource not found' });
    }
    return res.status(400).json({ message: 'Database constraint error' });
  }

  // Generic response for all other errors
  res.status(status).json({
    message,
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({ message: 'Resource not found' });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
