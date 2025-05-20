const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../../shared/middleware/auth');
const ticketController = require('../controllers/ticketController');

// Get all tickets with optional status filter
router.get(
  '/',
  authenticateToken,
  authorizeRole(['attendant', 'admin']),
  ticketController.getTickets
);

// Get a specific ticket
router.get(
  '/:id',
  authenticateToken,
  authorizeRole(['attendant', 'admin']),
  ticketController.getTicket
);

// Create a new ticket
router.post(
  '/',
  authenticateToken,
  authorizeRole(['attendant']),
  ticketController.createTicket
);

// Complete a ticket
router.post(
  '/:id/complete',
  authenticateToken,
  authorizeRole(['attendant']),
  ticketController.completeTicket
);

// Cancel a ticket
router.post(
  '/:id/cancel',
  authenticateToken,
  authorizeRole(['attendant', 'admin']),
  ticketController.cancelTicket
);

// Update ticket details
router.patch(
  '/:id',
  authenticateToken,
  authorizeRole(['attendant']),
  ticketController.updateTicket
);

module.exports = router;
