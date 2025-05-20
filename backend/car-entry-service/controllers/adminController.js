const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get all cars with filters
const getAllCars = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, parkingId } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        c.*,
        u.name as owner_name,
        p.name as last_parking_name
      FROM cars c
      LEFT JOIN users u ON c.owner_id = u.id
      LEFT JOIN parking_spaces ps ON c.last_parking_space_id = ps.id
      LEFT JOIN parkings p ON ps.parking_id = p.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND c.plate_number ILIKE $${paramCount}`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (parkingId) {
      query += ` AND ps.parking_id = $${paramCount}`;
      params.push(parkingId);
      paramCount++;
    }

    // Get total count
    const countQuery = query.replace('c.*,', 'COUNT(*) as total,');
    const countResult = await pool.query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].total);

    // Add pagination
    query += ` ORDER BY c.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      data: result.rows,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all tickets with filters
const getAllTickets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      plate,
      parkingId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
    } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        t.*,
        ps.name as parking_space_name,
        p.name as parking_name,
        a.name as attendant_name
      FROM tickets t
      LEFT JOIN parking_spaces ps ON t.parking_space_id = ps.id
      LEFT JOIN parkings p ON ps.parking_id = p.id
      LEFT JOIN attendants a ON t.attendant_id = a.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (plate) {
      query += ` AND t.car_number ILIKE $${paramCount}`;
      params.push(`%${plate}%`);
      paramCount++;
    }

    if (parkingId) {
      query += ` AND ps.parking_id = $${paramCount}`;
      params.push(parkingId);
      paramCount++;
    }

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

    if (minAmount) {
      query += ` AND t.amount >= $${paramCount}`;
      params.push(minAmount);
      paramCount++;
    }

    if (maxAmount) {
      query += ` AND t.amount <= $${paramCount}`;
      params.push(maxAmount);
      paramCount++;
    }

    // Get total count
    const countQuery = query.replace('t.*,', 'COUNT(*) as total,');
    const countResult = await pool.query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].total);

    // Add pagination
    query += ` ORDER BY t.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      data: result.rows,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get ticket statistics
const getTicketStats = async (req, res) => {
  try {
    const { startDate, endDate, parkingId } = req.query;
    
    let query = `
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tickets,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_tickets,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
        AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as average_amount
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

    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching ticket statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get car statistics
const getCarStats = async (req, res) => {
  try {
    const { parkingId } = req.query;
    
    let query = `
      SELECT 
        COUNT(*) as total_cars,
        COUNT(CASE WHEN is_parked = true THEN 1 END) as parked_cars,
        COUNT(DISTINCT owner_id) as unique_owners
      FROM cars c
      LEFT JOIN parking_spaces ps ON c.last_parking_space_id = ps.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (parkingId) {
      query += ` AND ps.parking_id = $${paramCount}`;
      params.push(parkingId);
      paramCount++;
    }

    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching car statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllCars,
  getAllTickets,
  getTicketStats,
  getCarStats,
}; 