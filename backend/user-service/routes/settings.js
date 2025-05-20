const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../../shared/middleware/auth');
const settingsController = require('../controllers/settingsController');

// Get user settings
router.get(
  '/user/settings',
  authenticateToken,
  authorizeRole(['user']),
  settingsController.getUserSettings
);

// Update user settings
router.patch(
  '/user/settings',
  authenticateToken,
  authorizeRole(['user']),
  settingsController.updateUserSettings
);

// Get attendant settings
router.get(
  '/attendant/settings',
  authenticateToken,
  authorizeRole(['attendant']),
  settingsController.getAttendantSettings
);

// Update attendant settings
router.patch(
  '/attendant/settings',
  authenticateToken,
  authorizeRole(['attendant']),
  settingsController.updateAttendantSettings
);

module.exports = router; 