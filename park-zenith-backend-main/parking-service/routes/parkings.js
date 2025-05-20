
const express = require('express');
const router = express.Router();
const parkingsController = require('../controllers/parkings');
const { authenticateJWT, authorize } = require('../../shared/middleware/auth');

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @swagger
 * /api/parkings:
 *   get:
 *     summary: Get all parking lots with pagination
 *     security:
 *       - bearerAuth: []
 *     tags: [Parkings]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name, code or location
 *       - in: query
 *         name: hasSpace
 *         schema:
 *           type: boolean
 *         description: Filter by availability
 *     responses:
 *       200:
 *         description: A paginated list of parking lots
 *       401:
 *         description: Unauthorized
 */
router.get('/', parkingsController.getAllParkings);

/**
 * @swagger
 * /api/parkings/availability:
 *   get:
 *     summary: Get availability information for all parking lots
 *     security:
 *       - bearerAuth: []
 *     tags: [Parkings]
 *     responses:
 *       200:
 *         description: Availability information for all parking lots
 *       401:
 *         description: Unauthorized
 */
router.get('/availability', parkingsController.getParkingAvailability);

/**
 * @swagger
 * /api/parkings/{id}:
 *   get:
 *     summary: Get parking lot by ID
 *     security:
 *       - bearerAuth: []
 *     tags: [Parkings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Parking lot ID
 *     responses:
 *       200:
 *         description: Parking lot details
 *       400:
 *         description: Invalid parking ID
 *       404:
 *         description: Parking lot not found
 */
router.get('/:id', parkingsController.getParkingById);

/**
 * @swagger
 * /api/parkings:
 *   post:
 *     summary: Create a new parking lot
 *     security:
 *       - bearerAuth: []
 *     tags: [Parkings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - location
 *               - total_spaces
 *               - fee_per_hour
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               total_spaces:
 *                 type: integer
 *                 minimum: 1
 *               fee_per_hour:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *     responses:
 *       201:
 *         description: Parking lot created successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Parking lot already exists with this code
 */
router.post('/', authorize(['admin']), parkingsController.createParking);

/**
 * @swagger
 * /api/parkings/{id}:
 *   put:
 *     summary: Update a parking lot
 *     security:
 *       - bearerAuth: []
 *     tags: [Parkings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Parking lot ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               total_spaces:
 *                 type: integer
 *                 minimum: 1
 *               fee_per_hour:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Parking lot updated successfully
 *       400:
 *         description: Invalid input or cannot reduce spaces
 *       404:
 *         description: Parking lot not found
 */
router.put('/:id', authorize(['admin']), parkingsController.updateParking);

/**
 * @swagger
 * /api/parkings/{id}:
 *   delete:
 *     summary: Delete a parking lot
 *     security:
 *       - bearerAuth: []
 *     tags: [Parkings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Parking lot ID
 *     responses:
 *       200:
 *         description: Parking lot deleted successfully
 *       400:
 *         description: Cannot delete parking lot with active entries
 *       404:
 *         description: Parking lot not found
 */
router.delete('/:id', authorize(['admin']), parkingsController.deleteParking);

/**
 * @swagger
 * /api/parkings/{id}/spaces:
 *   put:
 *     summary: Update available spaces (increment or decrement)
 *     security:
 *       - bearerAuth: []
 *     tags: [Parkings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Parking lot ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operation
 *             properties:
 *               operation:
 *                 type: string
 *                 enum: [increment, decrement]
 *     responses:
 *       200:
 *         description: Available spaces updated successfully
 *       400:
 *         description: Invalid operation or space constraints
 *       404:
 *         description: Parking lot not found
 */
router.put('/:id/spaces', authorize(['admin', 'attendant']), parkingsController.updateAvailableSpaces);

module.exports = router;
