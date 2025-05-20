const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeRoles } = require('../../shared/middleware/auth');
const ticketController = require('../controllers/ticketController');

// Get all tickets
router.get(
  '/',
  authenticateJWT,
  authorizeRoles(['attendant', 'admin']),
  ticketController.getTickets
);

// Get ticket by ID
router.get(
  '/:id',
  authenticateJWT,
  authorizeRoles(['attendant', 'admin']),
  ticketController.getTicket
);

// Create new ticket
router.post(
  '/',
  authenticateJWT,
  authorizeRoles(['attendant']),
  ticketController.createTicket
);

// Update ticket
router.put(
  '/:id',
  authenticateJWT,
  authorizeRoles(['attendant']),
  ticketController.updateTicket
);

// Complete ticket
router.post(
  '/:id/complete',
  authenticateJWT,
  authorizeRoles(['attendant']),
  ticketController.completeTicket
);

// Cancel ticket
router.post(
  '/:id/cancel',
  authenticateJWT,
  authorizeRoles(['attendant', 'admin']),
  ticketController.cancelTicket
);

module.exports = router;
