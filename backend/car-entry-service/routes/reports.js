const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeRoles } = require('../../shared/middleware/auth');
const reportController = require('../controllers/reportController');

// Get activity logs
router.get(
  '/logs',
  authenticateJWT,
  authorizeRoles(['admin']),
  reportController.getLogs
);

// Get entries report
router.get(
  '/entries',
  authenticateJWT,
  authorizeRoles(['admin']),
  reportController.getEntriesReport
);

// Get exits report
router.get(
  '/exits',
  authenticateJWT,
  authorizeRoles(['admin']),
  reportController.getExitsReport
);

// Get revenue report
router.get(
  '/revenue',
  authenticateJWT,
  authorizeRoles(['admin']),
  reportController.getRevenueReport
);

module.exports = router; 