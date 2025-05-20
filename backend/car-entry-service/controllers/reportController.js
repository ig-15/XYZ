const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get activity logs
const getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        l.*,
        u.name as user_name
      FROM activity_logs l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (startDate) {
      query += ` AND l.timestamp >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND l.timestamp <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    // Get total count
    const countQuery = query.replace('l.*,', 'COUNT(*) as total,');
    const countResult = await pool.query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].total);

    // Add pagination
    query += ` ORDER BY l.timestamp DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      data: result.rows,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get entries report
const getEntriesReport = async (req, res) => {
  try {
    const { startDate, endDate, parkingId } = req.query;
    
    let query = `
      WITH daily_stats AS (
        SELECT 
          DATE(t.entry_time) as date,
          COUNT(*) as count,
          COUNT(DISTINCT t.car_number) as unique_cars
        FROM tickets t
        LEFT JOIN parking_spaces ps ON t.parking_space_id = ps.id
        WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (startDate) {
      query += ` AND t.entry_time >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND t.entry_time <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    if (parkingId) {
      query += ` AND ps.parking_id = $${paramCount}`;
      params.push(parkingId);
      paramCount++;
    }

    query += `
        GROUP BY DATE(t.entry_time)
      )
      SELECT 
        json_agg(daily_stats) as dailyStats,
        SUM(count) as total_entries,
        SUM(unique_cars) as total_unique_cars
      FROM daily_stats
    `;

    const result = await pool.query(query, params);
    res.json({
      data: {
        dailyStats: result.rows[0].dailystats || [],
        totalEntries: parseInt(result.rows[0].total_entries) || 0,
        totalUniqueCars: parseInt(result.rows[0].total_unique_cars) || 0,
      },
    });
  } catch (error) {
    console.error('Error generating entries report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get exits report
const getExitsReport = async (req, res) => {
  try {
    const { startDate, endDate, parkingId } = req.query;
    
    let query = `
      WITH daily_stats AS (
        SELECT 
          DATE(t.exit_time) as date,
          COUNT(*) as count,
          SUM(t.amount) as total_revenue
        FROM tickets t
        LEFT JOIN parking_spaces ps ON t.parking_space_id = ps.id
        WHERE t.status = 'completed'
    `;
    const params = [];
    let paramCount = 1;

    if (startDate) {
      query += ` AND t.exit_time >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND t.exit_time <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    if (parkingId) {
      query += ` AND ps.parking_id = $${paramCount}`;
      params.push(parkingId);
      paramCount++;
    }

    query += `
        GROUP BY DATE(t.exit_time)
      )
      SELECT 
        json_agg(daily_stats) as dailyStats,
        SUM(count) as total_exits,
        SUM(total_revenue) as total_revenue
      FROM daily_stats
    `;

    const result = await pool.query(query, params);
    res.json({
      data: {
        dailyStats: result.rows[0].dailystats || [],
        totalExits: parseInt(result.rows[0].total_exits) || 0,
        totalRevenue: parseFloat(result.rows[0].total_revenue) || 0,
      },
    });
  } catch (error) {
    console.error('Error generating exits report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get revenue report
const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate, parkingId } = req.query;
    
    let query = `
      WITH daily_stats AS (
        SELECT 
          DATE(t.exit_time) as date,
          COUNT(*) as transactions,
          SUM(t.amount) as revenue,
          AVG(t.amount) as average_amount
        FROM tickets t
        LEFT JOIN parking_spaces ps ON t.parking_space_id = ps.id
        WHERE t.status = 'completed'
    `;
    const params = [];
    let paramCount = 1;

    if (startDate) {
      query += ` AND t.exit_time >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND t.exit_time <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    if (parkingId) {
      query += ` AND ps.parking_id = $${paramCount}`;
      params.push(parkingId);
      paramCount++;
    }

    query += `
        GROUP BY DATE(t.exit_time)
      )
      SELECT 
        json_agg(daily_stats) as dailyStats,
        SUM(transactions) as total_transactions,
        SUM(revenue) as total_revenue,
        AVG(average_amount) as overall_average
      FROM daily_stats
    `;

    const result = await pool.query(query, params);
    res.json({
      data: {
        dailyStats: result.rows[0].dailystats || [],
        totalTransactions: parseInt(result.rows[0].total_transactions) || 0,
        totalRevenue: parseFloat(result.rows[0].total_revenue) || 0,
        overallAverage: parseFloat(result.rows[0].overall_average) || 0,
      },
    });
  } catch (error) {
    console.error('Error generating revenue report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getLogs,
  getEntriesReport,
  getExitsReport,
  getRevenueReport,
}; 