const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../../shared/middleware/auth');
const reportController = require('../controllers/reportController');

// Get activity logs
router.get(
  '/logs',
  authenticateToken,
  authorizeRole(['admin']),
  reportController.getLogs
);

// Get entries report
router.get(
  '/entries',
  authenticateToken,
  authorizeRole(['admin']),
  reportController.getEntriesReport
);

// Get exits report
router.get(
  '/exits',
  authenticateToken,
  authorizeRole(['admin']),
  reportController.getExitsReport
);

// Get revenue report
router.get(
  '/revenue',
  authenticateToken,
  authorizeRole(['admin']),
  reportController.getRevenueReport
);

module.exports = router; 