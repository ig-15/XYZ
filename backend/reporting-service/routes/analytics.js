const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics');
const { authenticateJWT, authorizeRoles } = require('../../shared/middleware/auth');

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Parking management analytics endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserRoleStats:
 *       type: object
 *       additionalProperties:
 *         type: integer
 *       example:
 *         admin: 2
 *         attendant: 5
 *         customer: 35
 *     ParkingStats:
 *       type: object
 *       properties:
 *         total_parkings:
 *           type: integer
 *           example: 5
 *         total_spaces:
 *           type: integer
 *           example: 500
 *         available_spaces:
 *           type: integer
 *           example: 150
 *         occupied_spaces:
 *           type: integer
 *           example: 350
 *         occupancy_rate:
 *           type: number
 *           format: float
 *           example: 70.0
 *     DailyStats:
 *       type: object
 *       properties:
 *         active_entries:
 *           type: integer
 *           example: 25
 *         completed_entries:
 *           type: integer
 *           example: 100
 *         revenue:
 *           type: string
 *           example: "1250.50"
 *     ComparisonStats:
 *       type: object
 *       properties:
 *         entry_change_percent:
 *           type: number
 *           format: float
 *           example: 11.11
 *         revenue_change_percent:
 *           type: number
 *           format: float
 *           example: 11.09
 *     HourlyOccupancy:
 *       type: object
 *       properties:
 *         hour:
 *           type: integer
 *           example: 8
 *         entries:
 *           type: integer
 *           example: 25
 *         exits:
 *           type: integer
 *           example: 10
 *         occupancy:
 *           type: integer
 *           example: 15
 *     PeakHour:
 *       type: object
 *       properties:
 *         hour:
 *           type: integer
 *           example: 8
 *         formatted_hour:
 *           type: string
 *           example: "8:00 - 9:00"
 *         count:
 *           type: integer
 *           example: 125
 *     BusiestDay:
 *       type: object
 *       properties:
 *         day_of_week:
 *           type: integer
 *           example: 1
 *         day_name:
 *           type: string
 *           example: "Monday"
 *         count:
 *           type: integer
 *           example: 350
 *     DurationAnalysis:
 *       type: object
 *       properties:
 *         duration_category:
 *           type: string
 *           example: "1-3 hours"
 *         count:
 *           type: integer
 *           example: 120
 *         total_revenue:
 *           type: string
 *           example: "1800.00"
 *         avg_revenue:
 *           type: string
 *           example: "15.00"
 *         percentage:
 *           type: number
 *           format: float
 *           example: 30.5
 */

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 42
 *                     by_role:
 *                       $ref: '#/components/schemas/UserRoleStats'
 *                 parkings:
 *                   $ref: '#/components/schemas/ParkingStats'
 *                 today:
 *                   $ref: '#/components/schemas/DailyStats'
 *                 yesterday:
 *                   type: object
 *                   properties:
 *                     completed_entries:
 *                       type: integer
 *                       example: 90
 *                     revenue:
 *                       type: string
 *                       example: "1125.75"
 *                 comparison:
 *                   $ref: '#/components/schemas/ComparisonStats'
 *                 last_30_days:
 *                   type: object
 *                   properties:
 *                     total_entries:
 *                       type: integer
 *                       example: 2500
 *                     completed_entries:
 *                       type: integer
 *                       example: 2450
 *                     revenue:
 *                       type: string
 *                       example: "30625.00"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/dashboard-summary', authorizeRoles(['admin']), analyticsController.getDashboardSummary);

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
 *         description: Date for hourly statistics (YYYY-MM-DD)
 *       - in: query
 *         name: parkingId
 *         schema:
 *           type: integer
 *         description: Filter by parking ID
 *     responses:
 *       200:
 *         description: Hourly occupancy statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date:
 *                   type: string
 *                   example: "2023-05-15"
 *                 parking_id:
 *                   type: string
 *                   example: "all"
 *                 hourly_data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HourlyOccupancy'
 *       400:
 *         description: Missing required parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/hourly-occupancy', authorizeRoles(['admin']), analyticsController.getHourlyOccupancy);

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
 *         description: Start date for analysis (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date for analysis (YYYY-MM-DD)
 *       - in: query
 *         name: parkingId
 *         schema:
 *           type: integer
 *         description: Filter by parking ID
 *     responses:
 *       200:
 *         description: Peak hours analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 startDate:
 *                   type: string
 *                   example: "2023-05-01"
 *                 endDate:
 *                   type: string
 *                   example: "2023-05-15"
 *                 parking_id:
 *                   type: string
 *                   example: "all"
 *                 peak_entry_hours:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PeakHour'
 *                 peak_exit_hours:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PeakHour'
 *                 busiest_days:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BusiestDay'
 *       400:
 *         description: Missing required parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/peak-hours', authorizeRoles(['admin']), analyticsController.getPeakHoursAnalysis);

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
 *         description: Start date for analysis (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date for analysis (YYYY-MM-DD)
 *       - in: query
 *         name: parkingId
 *         schema:
 *           type: integer
 *         description: Filter by parking ID
 *     responses:
 *       200:
 *         description: Duration and revenue analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 startDate:
 *                   type: string
 *                   example: "2023-05-01"
 *                 endDate:
 *                   type: string
 *                   example: "2023-05-15"
 *                 parking_id:
 *                   type: string
 *                   example: "all"
 *                 total_entries:
 *                   type: integer
 *                   example: 500
 *                 total_revenue:
 *                   type: string
 *                   example: "6250.00"
 *                 duration_analysis:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DurationAnalysis'
 *       400:
 *         description: Missing required parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/duration-revenue', authorizeRoles(['admin']), analyticsController.getDurationRevenueAnalysis);

module.exports = router;