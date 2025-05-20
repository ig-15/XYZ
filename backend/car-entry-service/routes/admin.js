const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeRoles } = require('../../shared/middleware/auth');
const adminController = require('../controllers/adminController');

// Get all cars with filters
router.get(
  '/cars',
  authenticateJWT,
  authorizeRoles(['admin']),
  adminController.getAllCars
);

// Get all tickets with filters
router.get(
  '/tickets',
  authenticateJWT,
  authorizeRoles(['admin']),
  adminController.getAllTickets
);

// Get ticket statistics
router.get(
  '/tickets/stats',
  authenticateJWT,
  authorizeRoles(['admin']),
  adminController.getTicketStats
);

// Get car statistics
router.get(
  '/cars/stats',
  authenticateJWT,
  authorizeRoles(['admin']),
  adminController.getCarStats
);

module.exports = router; 