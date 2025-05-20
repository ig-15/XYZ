const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get all tickets with optional status filter
const getTickets = async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM tickets';
    const params = [];

    if (status && status !== 'all') {
      query += ' WHERE status = $1';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a specific ticket
const getTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new ticket
const createTicket = async (req, res) => {
  try {
    const { carNumber, parkingSpaceId } = req.body;
    const attendantId = req.user.id;

    const result = await pool.query(
      `INSERT INTO tickets (car_number, parking_space_id, attendant_id, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING *`,
      [carNumber, parkingSpaceId, attendantId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Complete a ticket
const completeTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const result = await pool.query(
      `UPDATE tickets 
       SET status = 'completed', 
           exit_time = CURRENT_TIMESTAMP,
           amount = $1
       WHERE id = $2 AND status = 'active'
       RETURNING *`,
      [amount, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Active ticket not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error completing ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Cancel a ticket
const cancelTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE tickets 
       SET status = 'cancelled'
       WHERE id = $1 AND status = 'active'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Active ticket not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error cancelling ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update ticket details
const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { carNumber, parkingSpaceId } = req.body;

    const result = await pool.query(
      `UPDATE tickets 
       SET car_number = COALESCE($1, car_number),
           parking_space_id = COALESCE($2, parking_space_id)
       WHERE id = $3 AND status = 'active'
       RETURNING *`,
      [carNumber, parkingSpaceId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Active ticket not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getTickets,
  getTicket,
  createTicket,
  completeTicket,
  cancelTicket,
  updateTicket,
}; 