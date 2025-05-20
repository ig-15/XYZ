const express = require('express');
const router = express.Router();
const entriesController = require('../controllers/entries');
const { authenticateJWT, authorizeRoles } = require('../../shared/middleware/auth');

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @swagger
 * /api/entries:
 *   get:
 *     summary: Get all entries with pagination
 *     security:
 *       - bearerAuth: []
 *     tags: [Entries]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed]
 *         description: Filter by entry status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by entry time (start)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by entry time (end)
 *     responses:
 *       200:
 *         description: A paginated list of entries
 *       401:
 *         description: Unauthorized
 */
router.get('/', authorizeRoles(['admin', 'attendant']), entriesController.getAllEntries);

/**
 * @swagger
 * /api/entries/active:
 *   get:
 *     summary: Get active entries
 *     security:
 *       - bearerAuth: []
 *     tags: [Entries]
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
 *         name: parkingId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by parking ID
 *     responses:
 *       200:
 *         description: List of active entries
 *       401:
 *         description: Unauthorized
 */
router.get('/active', authorizeRoles(['admin', 'attendant']), entriesController.getActiveEntries);

/**
 * @swagger
 * /api/entries/{id}:
 *   get:
 *     summary: Get entry by ID
 *     security:
 *       - bearerAuth: []
 *     tags: [Entries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Entry ID
 *     responses:
 *       200:
 *         description: Entry details
 *       400:
 *         description: Invalid entry ID
 *       404:
 *         description: Entry not found
 */
router.get('/:id', authorizeRoles(['admin', 'attendant']), entriesController.getEntryById);

/**
 * @swagger
 * /api/entries:
 *   post:
 *     summary: Register a new car entry
 *     security:
 *       - bearerAuth: []
 *     tags: [Entries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - car_id
 *               - parking_id
 *             properties:
 *               car_id:
 *                 type: string
 *                 format: uuid
 *               parking_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Entry registered successfully
 *       400:
 *         description: Invalid input or no available spaces
 *       404:
 *         description: Car or parking not found
 *       409:
 *         description: Car already has an active entry
 */
router.post('/', authorizeRoles(['admin', 'attendant']), entriesController.registerEntry);

/**
 * @swagger
 * /api/entries/{id}/exit:
 *   post:
 *     summary: Register car exit and calculate fee
 *     security:
 *       - bearerAuth: []
 *     tags: [Entries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Entry ID
 *     responses:
 *       200:
 *         description: Exit registered and fee calculated
 *       400:
 *         description: Invalid entry ID or car already exited
 *       404:
 *         description: Entry not found
 */
router.post('/:id/exit', authorizeRoles(['admin', 'attendant']), entriesController.registerExit);

module.exports = router;