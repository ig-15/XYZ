const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeRoles } = require('../../shared/middleware/auth');
const settingsController = require('../controllers/settingsController');

// Get user settings
router.get(
  '/users/settings',
  authenticateJWT,
  authorizeRoles(['user']),
  settingsController.getUserSettings
);

// Update user settings
router.put(
  '/users/settings',
  authenticateJWT,
  authorizeRoles(['user']),
  settingsController.updateUserSettings
);

// Get attendant settings
router.get(
  '/attendants/settings',
  authenticateJWT,
  authorizeRoles(['attendant']),
  settingsController.getAttendantSettings
);

// Update attendant settings
router.put(
  '/attendants/settings',
  authenticateJWT,
  authorizeRoles(['attendant']),
  settingsController.updateAttendantSettings
);

module.exports = router; 