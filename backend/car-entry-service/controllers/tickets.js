const db = require('../../shared/db');

// Helper for pagination
const paginate = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return { limit: parseInt(limit), offset: parseInt(offset) };
};

// GET /api/tickets
exports.getAllTickets = async (req, res) => {
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

    const { offset } = paginate(page, limit);
    const params = [];
    let query = `SELECT * FROM tickets WHERE 1=1`;

    if (plate) {
      query += ` AND plate ILIKE $${params.length + 1}`;
      params.push(`%${plate}%`);
    }
    if (parkingId) {
      query += ` AND parking_id = $${params.length + 1}`;
      params.push(parkingId);
    }
    if (startDate) {
      query += ` AND issue_date >= $${params.length + 1}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND issue_date <= $${params.length + 1}`;
      params.push(endDate);
    }
    if (minAmount) {
      query += ` AND amount >= $${params.length + 1}`;
      params.push(minAmount);
    }
    if (maxAmount) {
      query += ` AND amount <= $${params.length + 1}`;
      params.push(maxAmount);
    }

    query += ` ORDER BY issue_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.status(200).json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching tickets:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/tickets/:id
exports.getTicketById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM tickets WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching ticket by ID:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/tickets/user/:userId
exports.getUserTickets = async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const { offset } = paginate(page, limit);

  try {
    const result = await db.query(
      'SELECT * FROM tickets WHERE user_id = $1 ORDER BY issue_date DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );

    res.status(200).json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching user tickets:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/tickets
exports.generateTicket = async (req, res) => {
  const { user_id, plate, parking_id, amount } = req.body;

  if (!user_id || !plate || !parking_id || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const issue_date = new Date(); // current timestamp
    const status = 'UNPAID'; // or 'ACTIVE', based on your logic

    const insertQuery = `
      INSERT INTO tickets (user_id, plate, parking_id, amount, issue_date, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const result = await db.query(insertQuery, [
      user_id,
      plate,
      parking_id,
      amount,
      issue_date,
      status,
    ]);

    res.status(201).json({
      success: true,
      message: 'Ticket generated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error generating ticket:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/tickets/:id - Update ticket status
exports.updateTicketStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    // First check if ticket exists
    const checkResult = await db.query('SELECT * FROM tickets WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Update the ticket status
    const updateQuery = 'UPDATE tickets SET status = $1 WHERE id = $2 RETURNING *';
    const result = await db.query(updateQuery, [status, id]);

    res.status(200).json({
      success: true,
      message: 'Ticket status updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating ticket status:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/tickets/entry/:entryId - Get tickets by entry ID
exports.getTicketsByEntry = async (req, res) => {
  const { entryId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const { offset } = paginate(page, limit);

  try {
    // Get tickets for this entry with pagination
    const query = `
      SELECT 
        t.id,
        t.entry_id,
        t.issued_time,
        t.total_amount,
        t.created_at,
        t.updated_at,
        e.vehicle_plate,
        e.entry_time,
        e.exit_time
      FROM tickets t
      JOIN entries e ON t.entry_id = e.id
      WHERE t.entry_id = $1 
      ORDER BY t.issued_time DESC 
      LIMIT $2 OFFSET $3
    `;
    
    const result = await db.query(query, [entryId, limit, offset]);

    // Get total count for pagination info
    const countQuery = 'SELECT COUNT(*) FROM tickets WHERE entry_id = $1';
    const countResult = await db.query(countQuery, [entryId]);
    const total = parseInt(countResult.rows[0].count);

    res.status(200).json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching tickets by entry:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Server error while fetching tickets by entry' 
    });
  }
};