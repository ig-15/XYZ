const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports');
const { authenticateJWT, authorizeRoles } = require('../../shared/middleware/auth');

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @swagger
 * /api/reports/entry-exit-logs:
 *   get:
 *     summary: Get entry/exit logs with filters
 *     security:
 *       - bearerAuth: []
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date
 *       - in: query
 *         name: parkingId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by parking ID
 *       - in: query
 *         name: plate
 *         schema:
 *           type: string
 *         description: Filter by car plate number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [entry, exit, all]
 *         description: Filter by entry/exit status
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
 *         description: A paginated list of entry/exit logs
 *       401:
 *         description: Unauthorized
 */
router.get('/entry-exit-logs', authorizeRoles(['admin', 'attendant']), reportsController.getEntryExitLogs);

/**
 * @swagger
 * /api/reports/revenue/by-parking:
 *   get:
 *     summary: Get revenue report by parking lot
 *     security:
 *       - bearerAuth: []
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date for report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date for report
 *     responses:
 *       200:
 *         description: Revenue report grouped by parking lot
 *       400:
 *         description: Missing required parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/revenue/by-parking', authorizeRoles(['admin']), reportsController.getRevenueByParking);

/**
 * @swagger
 * /api/reports/revenue/daily:
 *   get:
 *     summary: Get daily revenue report
 *     security:
 *       - bearerAuth: []
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date for report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date for report
 *       - in: query
 *         name: parkingId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by parking ID
 *     responses:
 *       200:
 *         description: Daily revenue report
 *       400:
 *         description: Missing required parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/revenue/daily', authorizeRoles(['admin']), reportsController.getDailyRevenue);

/**
 * @swagger
 * /api/reports/parking-usage:
 *   get:
 *     summary: Get parking usage report
 *     security:
 *       - bearerAuth: []
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date for report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date for report
 *     responses:
 *       200:
 *         description: Parking usage report
 *       400:
 *         description: Missing required parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/parking-usage', authorizeRoles(['admin']), reportsController.getParkingUsage);

/**
 * @swagger
 * /api/reports/user-activity:
 *   get:
 *     summary: Get user activity logs
 *     security:
 *       - bearerAuth: []
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
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
 *         description: A paginated list of user activity logs
 *       401:
 *         description: Unauthorized
 */
router.get('/user-activity', authorizeRoles(['admin']), reportsController.getUserActivityLogs);

module.exports = router;
