
const db = require('../../shared/db');
const { logUserAction } = require('../../shared/utils/logger');
const { paginate, paginatedResponse } = require('../../shared/utils/pagination');
const { isValidUUID } = require('../../shared/utils/validation');

// Get all tickets (with pagination)
exports.getAllTickets = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req);
    
    // Handle filters
    const filters = [];
    const params = [];
    
    // Filter by car plate
    if (req.query.plate) {
      filters.push('c.plate_number ILIKE $' + (params.length + 1));
      params.push(`%${req.query.plate}%`);
    }
    
    // Filter by parking ID
    if (req.query.parkingId && isValidUUID(req.query.parkingId)) {
      filters.push('e.parking_id = $' + (params.length + 1));
      params.push(req.query.parkingId);
    }
    
    // Filter by date range
    if (req.query.startDate) {
      filters.push('t.issued_time >= $' + (params.length + 1));
      params.push(req.query.startDate);
    }
    
    if (req.query.endDate) {
      filters.push('t.issued_time <= $' + (params.length + 1));
      params.push(req.query.endDate);
    }
    
    // Filter by amount range
    if (req.query.minAmount) {
      filters.push('t.total_amount >= $' + (params.length + 1));
      params.push(parseFloat(req.query.minAmount));
    }
    
    if (req.query.maxAmount) {
      filters.push('t.total_amount <= $' + (params.length + 1));
      params.push(parseFloat(req.query.maxAmount));
    }
    
    // Build where clause
    const whereClause = filters.length > 0 ? 'WHERE ' + filters.join(' AND ') : '';
    
    // Count total tickets
    const countQuery = `
      SELECT COUNT(*) FROM tickets t
      JOIN entries e ON t.entry_id = e.id
      JOIN cars c ON e.car_id = c.id
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count, 10);
    
    // Get tickets with details
    const ticketsQuery = `
      SELECT t.id, t.issued_time, t.total_amount,
             e.id as entry_id, e.entry_time, e.exit_time,
             c.id as car_id, c.plate_number,
             p.id as parking_id, p.code as parking_code, p.name as parking_name
      FROM tickets t
      JOIN entries e ON t.entry_id = e.id
      JOIN cars c ON e.car_id = c.id
      JOIN parkings p ON e.parking_id = p.id
      ${whereClause}
      ORDER BY t.issued_time DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);
    
    const result = await db.query(ticketsQuery, params);
    
    // Format tickets
    const tickets = result.rows.map(row => ({
      id: row.id,
      issued_time: row.issued_time,
      total_amount: row.total_amount,
      entry: {
        id: row.entry_id,
        entry_time: row.entry_time,
        exit_time: row.exit_time,
        duration: Math.round((new Date(row.exit_time) - new Date(row.entry_time)) / 
                            (1000 * 60 * 60) * 10) / 10
      },
      car: {
        id: row.car_id,
        plate_number: row.plate_number
      },
      parking: {
        id: row.parking_id,
        code: row.parking_code,
        name: row.parking_name
      }
    }));
    
    // Return paginated response
    res.status(200).json(
      paginatedResponse(tickets, totalCount, page, limit)
    );
  } catch (error) {
    next(error);
  }
};

// Get ticket by ID
exports.getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid ticket ID format' });
    }
    
    const result = await db.query(
      `SELECT t.id, t.issued_time, t.total_amount,
              e.id as entry_id, e.entry_time, e.exit_time, e.charged_amount,
              c.id as car_id, c.plate_number, c.user_id,
              u.firstname, u.lastname, u.email,
              p.id as parking_id, p.code as parking_code, p.name as parking_name,
              p.location as parking_location, p.fee_per_hour
       FROM tickets t
       JOIN entries e ON t.entry_id = e.id
       JOIN cars c ON e.car_id = c.id
       LEFT JOIN users u ON c.user_id = u.id
       JOIN parkings p ON e.parking_id = p.id
       WHERE t.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    const ticket = result.rows[0];
    
    // Calculate duration
    const duration = Math.round((new Date(ticket.exit_time) - new Date(ticket.entry_time)) / 
                               (1000 * 60 * 60) * 10) / 10;
    
    // Format response
    res.status(200).json({
      id: ticket.id,
      issued_time: ticket.issued_time,
      total_amount: ticket.total_amount,
      entry: {
        id: ticket.entry_id,
        entry_time: ticket.entry_time,
        exit_time: ticket.exit_time,
        charged_amount: ticket.charged_amount,
        duration: duration
      },
      car: {
        id: ticket.car_id,
        plate_number: ticket.plate_number,
        user: ticket.user_id ? {
          id: ticket.user_id,
          firstname: ticket.firstname,
          lastname: ticket.lastname,
          email: ticket.email
        } : null
      },
      parking: {
        id: ticket.parking_id,
        code: ticket.parking_code,
        name: ticket.parking_name,
        location: ticket.parking_location,
        fee_per_hour: ticket.fee_per_hour
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get user tickets
exports.getUserTickets = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit, offset, page } = paginate(req);
    
    if (!isValidUUID(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    // Check if user exists
    const userExists = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Count total tickets for this user
    const countResult = await db.query(
      `SELECT COUNT(*) FROM tickets t
       JOIN entries e ON t.entry_id = e.id
       JOIN cars c ON e.car_id = c.id
       WHERE c.user_id = $1`,
      [userId]
    );
    const totalCount = parseInt(countResult.rows[0].count, 10);
    
    // Get tickets for this user
    const result = await db.query(
      `SELECT t.id, t.issued_time, t.total_amount,
              e.id as entry_id, e.entry_time, e.exit_time,
              c.id as car_id, c.plate_number,
              p.id as parking_id, p.code as parking_code, p.name as parking_name
       FROM tickets t
       JOIN entries e ON t.entry_id = e.id
       JOIN cars c ON e.car_id = c.id
       JOIN parkings p ON e.parking_id = p.id
       WHERE c.user_id = $1
       ORDER BY t.issued_time DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    // Format tickets
    const tickets = result.rows.map(row => ({
      id: row.id,
      issued_time: row.issued_time,
      total_amount: row.total_amount,
      entry: {
        id: row.entry_id,
        entry_time: row.entry_time,
        exit_time: row.exit_time,
        duration: Math.round((new Date(row.exit_time) - new Date(row.entry_time)) / 
                            (1000 * 60 * 60) * 10) / 10
      },
      car: {
        id: row.car_id,
        plate_number: row.plate_number
      },
      parking: {
        id: row.parking_id,
        code: row.parking_code,
        name: row.parking_name
      }
    }));
    
    res.status(200).json(
      paginatedResponse(tickets, totalCount, page, limit)
    );
  } catch (error) {
    next(error);
  }
};
