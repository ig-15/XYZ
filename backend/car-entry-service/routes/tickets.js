const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/tickets');
const { authenticateJWT, authorizeRoles } = require('../../shared/middleware/auth');

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @swagger
 * /api/tickets:
 *   get:
 *     summary: Get all tickets with pagination
 *     security:
 *       - bearerAuth: []
 *     tags: [Tickets]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: plate
 *         schema:
 *           type: string
 *         description: Filter by plate number (partial match)
 *       - in: query
 *         name: parkingId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by parking ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by issue date (start)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by issue date (end)
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *         description: Filter by minimum amount
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *         description: Filter by maximum amount
 *     responses:
 *       200:
 *         description: A paginated list of tickets
 *       401:
 *         description: Unauthorized
 */
router.get('/', authorizeRoles(['admin', 'attendant']), ticketController.getAllTickets);

/**
 * @swagger
 * /api/tickets/{id}:
 *   get:
 *     summary: Get ticket by ID
 *     security:
 *       - bearerAuth: []
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Ticket ID
 *     responses:
 *       200:
 *         description: Ticket details
 *       400:
 *         description: Invalid ticket ID
 *       404:
 *         description: Ticket not found
 */
router.put('/:id', authorizeRoles(['admin', 'attendant']), ticketController.updateTicketStatus);

/**
 * @swagger
 * /api/tickets/user/{userId}:
 *   get:
 *     summary: Get tickets for a specific user
 *     security:
 *       - bearerAuth: []
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: A paginated list of tickets for the user
 *       400:
 *         description: Invalid user ID
 *       404:
 *         description: User not found
 */
router.get('/user/:userId', authorizeRoles(['admin', 'attendant', 'user']), ticketController.getUserTickets);

module.exports = router;