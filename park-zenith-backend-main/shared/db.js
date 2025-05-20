
const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
  user: config.DB_CONFIG.username,
  host: config.DB_CONFIG.host,
  database: config.DB_CONFIG.database,
  password: config.DB_CONFIG.password,
  port: config.DB_CONFIG.port,
});

// Helper function for DB queries
const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Query error', { text, error });
    throw error;
  }
};

module.exports = {
  query,
  pool,
};
