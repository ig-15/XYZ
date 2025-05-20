const express = require('express');
const router = express.Router();
const carsController = require('../controllers/cars');
const { authenticateJWT, authorizeRoles } = require('../../shared/middleware/auth');

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @swagger
 * /api/cars:
 *   get:
 *     summary: Get all cars with pagination
 *     security:
 *       - bearerAuth: []
 *     tags: [Cars]
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
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *     responses:
 *       200:
 *         description: A paginated list of cars
 *       401:
 *         description: Unauthorized
 */
router.get('/', authorizeRoles(['admin', 'attendant']), carsController.getAllCars);

/**
 * @swagger
 * /api/cars/search:
 *   get:
 *     summary: Search cars by plate number
 *     security:
 *       - bearerAuth: []
 *     tags: [Cars]
 *     parameters:
 *       - in: query
 *         name: plate
 *         required: true
 *         schema:
 *           type: string
 *         description: Plate number (partial match)
 *     responses:
 *       200:
 *         description: List of matching cars
 *       400:
 *         description: Plate number is required
 */
router.get('/search', authorizeRoles(['admin', 'attendant']), carsController.searchCarByPlate);

/**
 * @swagger
 * /api/cars/{id}:
 *   get:
 *     summary: Get car by ID
 *     security:
 *       - bearerAuth: []
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Car ID
 *     responses:
 *       200:
 *         description: Car details
 *       400:
 *         description: Invalid car ID
 *       404:
 *         description: Car not found
 */
router.get('/:id', authorizeRoles(['admin', 'attendant']), carsController.getCarById);

/**
 * @swagger
 * /api/cars/register:
 *   post:
 *     summary: Register a new car
 *     security:
 *       - bearerAuth: []
 *     tags: [Cars]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plate_number
 *             properties:
 *               plate_number:
 *                 type: string
 *               user_id:
 *                 type: string
 *                 format: uuid
 *               make:
 *                 type: string
 *               model:
 *                 type: string
 *               color:
 *                 type: string
 *               year:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Car registered successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Car with this plate number already registered
 */
router.post('/register', authorizeRoles(['admin', 'attendant', 'user']), carsController.registerCar);

/**
 * @swagger
 * /api/cars/{id}:
 *   put:
 *     summary: Update a car
 *     security:
 *       - bearerAuth: []
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Car ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plate_number:
 *                 type: string
 *               user_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Car updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Car not found
 *       409:
 *         description: Plate number already in use by another car
 */
router.put('/:id', authorizeRoles(['admin', 'attendant']), carsController.updateCar);

/**
 * @swagger
 * /api/cars/{id}:
 *   delete:
 *     summary: Delete a car
 *     security:
 *       - bearerAuth: []
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Car ID
 *     responses:
 *       200:
 *         description: Car deleted successfully
 *       400:
 *         description: Cannot delete car with active entries
 *       404:
 *         description: Car not found
 */
router.delete('/:id', authorizeRoles(['admin']), carsController.deleteCar);

/**
 * @swagger
 * /api/cars/{id}/history:
 *   get:
 *     summary: Get car parking history
 *     security:
 *       - bearerAuth: []
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Car ID
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
 *         description: Car parking history
 *       400:
 *         description: Invalid car ID
 *       404:
 *         description: Car not found
 */
router.get('/:id/history', authorizeRoles(['admin', 'attendant']), carsController.getCarHistory);

module.exports = router;
