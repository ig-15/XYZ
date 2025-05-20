const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get user settings
const getUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT 
        u.email,
        u.name,
        u.phone,
        COALESCE(us.notifications, '{"email": true, "sms": true}'::jsonb) as notifications
       FROM users u
       LEFT JOIN user_settings us ON u.id = us.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user settings
const updateUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, notifications } = req.body;

    // Update user profile
    if (name || phone) {
      await pool.query(
        `UPDATE users 
         SET name = COALESCE($1, name),
             phone = COALESCE($2, phone)
         WHERE id = $3`,
        [name, phone, userId]
      );
    }

    // Update user settings
    if (notifications) {
      await pool.query(
        `INSERT INTO user_settings (user_id, notifications)
         VALUES ($1, $2)
         ON CONFLICT (user_id) 
         DO UPDATE SET notifications = $2`,
        [userId, notifications]
      );
    }

    // Fetch updated settings
    const result = await pool.query(
      `SELECT 
        u.email,
        u.name,
        u.phone,
        COALESCE(us.notifications, '{"email": true, "sms": true}'::jsonb) as notifications
       FROM users u
       LEFT JOIN user_settings us ON u.id = us.user_id
       WHERE u.id = $1`,
      [userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get attendant settings
const getAttendantSettings = async (req, res) => {
  try {
    const attendantId = req.user.id;
    const result = await pool.query(
      `SELECT 
        a.email,
        a.name,
        a.phone,
        COALESCE(as.shift, '{"startTime": "09:00", "endTime": "17:00"}'::jsonb) as shift,
        COALESCE(as.notifications, '{"email": true, "sms": true}'::jsonb) as notifications,
        COALESCE(as.auto_assign, false) as auto_assign
       FROM attendants a
       LEFT JOIN attendant_settings as ON a.id = as.attendant_id
       WHERE a.id = $1`,
      [attendantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attendant not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching attendant settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update attendant settings
const updateAttendantSettings = async (req, res) => {
  try {
    const attendantId = req.user.id;
    const { name, phone, shift, notifications, autoAssign } = req.body;

    // Update attendant profile
    if (name || phone) {
      await pool.query(
        `UPDATE attendants 
         SET name = COALESCE($1, name),
             phone = COALESCE($2, phone)
         WHERE id = $3`,
        [name, phone, attendantId]
      );
    }

    // Update attendant settings
    if (shift || notifications || autoAssign !== undefined) {
      await pool.query(
        `INSERT INTO attendant_settings (
          attendant_id, 
          shift, 
          notifications, 
          auto_assign
        )
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (attendant_id) 
         DO UPDATE SET 
           shift = COALESCE($2, attendant_settings.shift),
           notifications = COALESCE($3, attendant_settings.notifications),
           auto_assign = COALESCE($4, attendant_settings.auto_assign)`,
        [attendantId, shift, notifications, autoAssign]
      );
    }

    // Fetch updated settings
    const result = await pool.query(
      `SELECT 
        a.email,
        a.name,
        a.phone,
        COALESCE(as.shift, '{"startTime": "09:00", "endTime": "17:00"}'::jsonb) as shift,
        COALESCE(as.notifications, '{"email": true, "sms": true}'::jsonb) as notifications,
        COALESCE(as.auto_assign, false) as auto_assign
       FROM attendants a
       LEFT JOIN attendant_settings as ON a.id = as.attendant_id
       WHERE a.id = $1`,
      [attendantId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating attendant settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getUserSettings,
  updateUserSettings,
  getAttendantSettings,
  updateAttendantSettings,
}; 