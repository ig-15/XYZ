
const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users');
const { authenticateJWT, authorize } = require('../../shared/middleware/auth');

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users with pagination
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
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
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, attendant, user]
 *         description: Filter by role
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name or email
 *     responses:
 *       200:
 *         description: A paginated list of users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get('/', authorize(['admin']), usersController.getAllUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *       400:
 *         description: Invalid user ID
 *       404:
 *         description: User not found
 */
router.get('/:id', authorize(['admin', 'attendant']), usersController.getUserById);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstname
 *               - lastname
 *               - email
 *             properties:
 *               firstname:
 *                 type: string
 *               lastname:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [admin, attendant, user]
 *                 default: user
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: User already exists
 */
router.post('/', authorize(['admin']), usersController.createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update a user
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstname:
 *                 type: string
 *               lastname:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [admin, attendant, user]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User not found
 *       409:
 *         description: Email already in use
 */
router.put('/:id', authorize(['admin']), usersController.updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Cannot delete your own account
 *       404:
 *         description: User not found
 */
router.delete('/:id', authorize(['admin']), usersController.deleteUser);

/**
 * @swagger
 * /api/users/{id}/logs:
 *   get:
 *     summary: Get user activity logs
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
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
 *         description: User activity logs
 *       404:
 *         description: User not found
 */
router.get('/:id/logs', authorize(['admin']), usersController.getUserLogs);

/**
 * @swagger
 * /api/users/{id}/role:
 *   put:
 *     summary: Update user role
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, attendant, user]
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User not found
 */
router.put('/:id/role', authorize(['admin']), usersController.updateUserRole);

module.exports = router;
