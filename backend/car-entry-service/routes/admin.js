const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../../shared/middleware/auth');
const adminController = require('../controllers/adminController');

// Get all cars with filters
router.get(
  '/cars',
  authenticateToken,
  authorizeRole(['admin']),
  adminController.getAllCars
);

// Get all tickets with filters
router.get(
  '/tickets',
  authenticateToken,
  authorizeRole(['admin']),
  adminController.getAllTickets
);

// Get ticket statistics
router.get(
  '/tickets/stats',
  authenticateToken,
  authorizeRole(['admin']),
  adminController.getTicketStats
);

// Get car statistics
router.get(
  '/cars/stats',
  authenticateToken,
  authorizeRole(['admin']),
  adminController.getCarStats
);

module.exports = router; 