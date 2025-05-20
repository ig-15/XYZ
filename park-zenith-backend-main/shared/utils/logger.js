
const db = require('../db');

// Function to log user actions
const logUserAction = async (userId, action, description) => {
  try {
    await db.query(
      'INSERT INTO logs (user_id, action, description) VALUES ($1, $2, $3)',
      [userId, action, description]
    );
  } catch (error) {
    console.error('Logging error:', error);
  }
};

module.exports = {
  logUserAction,
};
