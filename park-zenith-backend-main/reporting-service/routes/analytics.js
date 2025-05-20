
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics');
const { authenticateJWT, authorize } = require('../../shared/middleware/auth');

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @swagger
 * /api/analytics/dashboard-summary:
 *   get:
 *     summary: Get dashboard summary statistics
 *     security:
 *       - bearerAuth: []
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Dashboard summary statistics
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard-summary', authorize(['admin']), analyticsController.getDashboardSummary);

/**
 * @swagger
 * /api/analytics/hourly-occupancy:
 *   get:
 *     summary: Get hourly occupancy statistics
 *     security:
 *       - bearerAuth: []
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Date for hourly statistics
 *       - in: query
 *         name: parkingId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by parking ID
 *     responses:
 *       200:
 *         description: Hourly occupancy statistics
 *       400:
 *         description: Missing required parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/hourly-occupancy', authorize(['admin']), analyticsController.getHourlyOccupancy);

/**
 * @swagger
 * /api/analytics/peak-hours:
 *   get:
 *     summary: Get peak hours analysis
 *     security:
 *       - bearerAuth: []
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date for analysis
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date for analysis
 *       - in: query
 *         name: parkingId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by parking ID
 *     responses:
 *       200:
 *         description: Peak hours analysis
 *       400:
 *         description: Missing required parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/peak-hours', authorize(['admin']), analyticsController.getPeakHoursAnalysis);

/**
 * @swagger
 * /api/analytics/duration-revenue:
 *   get:
 *     summary: Get duration and revenue analysis
 *     security:
 *       - bearerAuth: []
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date for analysis
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date for analysis
 *       - in: query
 *         name: parkingId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by parking ID
 *     responses:
 *       200:
 *         description: Duration and revenue analysis
 *       400:
 *         description: Missing required parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/duration-revenue', authorize(['admin']), analyticsController.getDurationRevenueAnalysis);

module.exports = router;
