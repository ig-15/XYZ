
// Basic validation utility functions
const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const isNonEmptyString = (str) => {
  return typeof str === 'string' && str.trim().length > 0;
};

const isPositiveNumber = (num) => {
  return !isNaN(num) && Number(num) > 0;
};

const isValidUUID = (uuid) => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
};

// Validate common request parameters
const validatePagination = (req) => {
  const errors = [];
  
  if (req.query.page && (isNaN(req.query.page) || Number(req.query.page) < 1)) {
    errors.push('Page number must be a positive integer');
  }
  
  if (req.query.limit && (isNaN(req.query.limit) || Number(req.query.limit) < 1)) {
    errors.push('Limit must be a positive integer');
  }
  
  return errors.length ? errors : null;
};

module.exports = {
  isValidEmail,
  isNonEmptyString,
  isPositiveNumber,
  isValidUUID,
  validatePagination,
};
