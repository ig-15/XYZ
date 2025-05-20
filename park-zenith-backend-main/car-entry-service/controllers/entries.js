
const db = require('../../shared/db');
const { logUserAction } = require('../../shared/utils/logger');
const { paginate, paginatedResponse } = require('../../shared/utils/pagination');
const { isNonEmptyString, isValidUUID } = require('../../shared/utils/validation');
const axios = require('axios');

// Helper function to update parking space availability
const updateParkingSpace = async (parkingId, operation) => {
  try {
    // In a real-world scenario, this would be configurable or service-discovery based
    const parkingServiceUrl = process.env.PARKING_SERVICE_URL || 'http://localhost:3002';
    
    await axios.put(`${parkingServiceUrl}/api/parkings/${parkingId}/spaces`, 
      { operation },
      { 
        headers: { 
          'Authorization': `Bearer ${process.env.SERVICE_TOKEN}` // In production, use a service account token
        } 
      }
    );
    return true;
  } catch (error) {
    console.error('Failed to update parking space:', error.message);
    return false;
  }
};

// Get all entries (with pagination)
exports.getAllEntries = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req);
    
    // Handle filters
    const filters = [];
    const params = [];
    
    // Filter by car plate number
    if (req.query.plate) {
      filters.push('c.plate_number ILIKE $' + (params.length + 1));
      params.push(`%${req.query.plate}%`);
    }
    
    // Filter by parking ID
    if (req.query.parkingId && isValidUUID(req.query.parkingId)) {
      filters.push('e.parking_id = $' + (params.length + 1));
      params.push(req.query.parkingId);
    }
    
    // Filter by status (active/completed)
    if (req.query.status === 'active') {
      filters.push('e.exit_time IS NULL');
    } else if (req.query.status === 'completed') {
      filters.push('e.exit_time IS NOT NULL');
    }
    
    // Filter by date range
    if (req.query.startDate) {
      filters.push('e.entry_time >= $' + (params.length + 1));
      params.push(req.query.startDate);
    }
    
    if (req.query.endDate) {
      filters.push('e.entry_time <= $' + (params.length + 1));
      params.push(req.query.endDate);
    }
    
    // Build where clause
    const whereClause = filters.length > 0 ? 'WHERE ' + filters.join(' AND ') : '';
    
    // Count total entries
    const countQuery = `
      SELECT COUNT(*) FROM entries e
      JOIN cars c ON e.car_id = c.id
      JOIN parkings p ON e.parking_id = p.id
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count, 10);
    
    // Get entries with details
    const entriesQuery = `
      SELECT e.id, e.entry_time, e.exit_time, e.charged_amount,
             c.id as car_id, c.plate_number,
             p.id as parking_id, p.code as parking_code, p.name as parking_name,
             p.location as parking_location, p.fee_per_hour
      FROM entries e
      JOIN cars c ON e.car_id = c.id
      JOIN parkings p ON e.parking_id = p.id
      ${whereClause}
      ORDER BY e.entry_time DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);
    
    const result = await db.query(entriesQuery, params);
    
    // Format entries
    const entries = result.rows.map(row => ({
      id: row.id,
      entry_time: row.entry_time,
      exit_time: row.exit_time,
      charged_amount: row.charged_amount,
      car: {
        id: row.car_id,
        plate_number: row.plate_number
      },
      parking: {
        id: row.parking_id,
        code: row.parking_code,
        name: row.parking_name,
        location: row.parking_location,
        fee_per_hour: row.fee_per_hour
      },
      duration: row.exit_time ? 
        Math.round((new Date(row.exit_time) - new Date(row.entry_time)) / (1000 * 60 * 60) * 10) / 10 : 
        null
    }));
    
    // Return paginated response
    res.status(200).json(
      paginatedResponse(entries, totalCount, page, limit)
    );
  } catch (error) {
    next(error);
  }
};

// Get entry by ID
exports.getEntryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid entry ID format' });
    }
    
    const result = await db.query(
      `SELECT e.id, e.entry_time, e.exit_time, e.charged_amount,
              c.id as car_id, c.plate_number, c.user_id,
              u.firstname, u.lastname, u.email,
              p.id as parking_id, p.code as parking_code, p.name as parking_name,
              p.location as parking_location, p.fee_per_hour,
              t.id as ticket_id, t.issued_time as ticket_issued_time, 
              t.total_amount as ticket_total_amount
       FROM entries e
       JOIN cars c ON e.car_id = c.id
       LEFT JOIN users u ON c.user_id = u.id
       JOIN parkings p ON e.parking_id = p.id
       LEFT JOIN tickets t ON e.id = t.entry_id
       WHERE e.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    
    const entry = result.rows[0];
    
    // Format response
    res.status(200).json({
      id: entry.id,
      entry_time: entry.entry_time,
      exit_time: entry.exit_time,
      charged_amount: entry.charged_amount,
      car: {
        id: entry.car_id,
        plate_number: entry.plate_number,
        user_id: entry.user_id,
        user: entry.user_id ? {
          id: entry.user_id,
          firstname: entry.firstname,
          lastname: entry.lastname,
          email: entry.email
        } : null
      },
      parking: {
        id: entry.parking_id,
        code: entry.parking_code,
        name: entry.parking_name,
        location: entry.parking_location,
        fee_per_hour: entry.fee_per_hour
      },
      ticket: entry.ticket_id ? {
        id: entry.ticket_id,
        issued_time: entry.ticket_issued_time,
        total_amount: entry.ticket_total_amount
      } : null,
      duration: entry.exit_time ? 
        Math.round((new Date(entry.exit_time) - new Date(entry.entry_time)) / (1000 * 60 * 60) * 10) / 10 : 
        null
    });
  } catch (error) {
    next(error);
  }
};

// Register a new car entry
exports.registerEntry = async (req, res, next) => {
  try {
    const { car_id, parking_id } = req.body;
    
    // Validate input
    const errors = [];
    if (!car_id || !isValidUUID(car_id)) {
      errors.push('Valid car ID is required');
    }
    
    if (!parking_id || !isValidUUID(parking_id)) {
      errors.push('Valid parking ID is required');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    
    // Check if car exists
    const carExists = await db.query(
      'SELECT id, plate_number FROM cars WHERE id = $1',
      [car_id]
    );
    if (carExists.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    // Check if parking exists
    const parkingResult = await db.query(
      'SELECT id, name, code, available_spaces FROM parkings WHERE id = $1',
      [parking_id]
    );
    if (parkingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Parking lot not found' });
    }
    
    // Check if there is available space
    if (parkingResult.rows[0].available_spaces <= 0) {
      return res.status(400).json({ message: 'No available parking spaces' });
    }
    
    // Check if car already has an active entry
    const activeEntry = await db.query(
      'SELECT id FROM entries WHERE car_id = $1 AND exit_time IS NULL',
      [car_id]
    );
    if (activeEntry.rows.length > 0) {
      return res.status(409).json({ 
        message: 'Car already has an active parking entry',
        entry_id: activeEntry.rows[0].id
      });
    }
    
    // Start a transaction
    await db.query('BEGIN');
    
    try {
      // Insert entry into database
      const entryResult = await db.query(
        `INSERT INTO entries (car_id, parking_id, entry_time) 
         VALUES ($1, $2, NOW()) 
         RETURNING id, entry_time`,
        [car_id, parking_id]
      );
      
      const entry = entryResult.rows[0];
      
      // Update parking space availability
      await updateParkingSpace(parking_id, 'decrement');
      
      // Commit transaction
      await db.query('COMMIT');
      
      // Log entry
      await logUserAction(
        req.user.id,
        'CAR_ENTRY',
        `Car ${carExists.rows[0].plate_number} entered parking ${parkingResult.rows[0].code}`
      );
      
      res.status(201).json({
        message: 'Car entry registered successfully',
        entry: {
          id: entry.id,
          car_id,
          parking_id,
          entry_time: entry.entry_time
        }
      });
    } catch (error) {
      // Rollback transaction in case of error
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Register car exit and calculate fee
exports.registerExit = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid entry ID format' });
    }
    
    // Get the entry with car and parking details
    const entryResult = await db.query(
      `SELECT e.id, e.car_id, e.parking_id, e.entry_time, e.exit_time,
              c.plate_number, p.fee_per_hour, p.code as parking_code
       FROM entries e
       JOIN cars c ON e.car_id = c.id
       JOIN parkings p ON e.parking_id = p.id
       WHERE e.id = $1`,
      [id]
    );
    
    if (entryResult.rows.length === 0) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    
    const entry = entryResult.rows[0];
    
    // Check if the car has already exited
    if (entry.exit_time) {
      return res.status(400).json({ 
        message: 'Car has already exited',
        exit_time: entry.exit_time
      });
    }
    
    // Calculate parking duration and fee
    const exitTime = new Date();
    const entryTime = new Date(entry.entry_time);
    const durationHours = (exitTime - entryTime) / (1000 * 60 * 60); // Duration in hours
    
    // Calculate charged amount - round up to nearest 10 minute increment
    const chargedHours = Math.ceil(durationHours * 6) / 6; // Round up to nearest 1/6 of an hour (10 minutes)
    const chargedAmount = parseFloat((chargedHours * entry.fee_per_hour).toFixed(2));
    
    // Start a transaction
    await db.query('BEGIN');
    
    try {
      // Update entry with exit time and charged amount
      const updatedEntryResult = await db.query(
        `UPDATE entries 
         SET exit_time = NOW(), charged_amount = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, exit_time, charged_amount`,
        [chargedAmount, id]
      );
      
      // Update parking space availability
      await updateParkingSpace(entry.parking_id, 'increment');
      
      // Create ticket
      const ticketResult = await db.query(
        `INSERT INTO tickets (entry_id, issued_time, total_amount)
         VALUES ($1, NOW(), $2)
         RETURNING id, issued_time, total_amount`,
        [id, chargedAmount]
      );
      
      // Commit transaction
      await db.query('COMMIT');
      
      // Log exit
      await logUserAction(
        req.user.id,
        'CAR_EXIT',
        `Car ${entry.plate_number} exited parking ${entry.parking_code} with fee $${chargedAmount}`
      );
      
      res.status(200).json({
        message: 'Car exit registered successfully',
        entry: {
          id: id,
          exit_time: updatedEntryResult.rows[0].exit_time,
          charged_amount: chargedAmount,
          duration_hours: parseFloat(durationHours.toFixed(2))
        },
        ticket: ticketResult.rows[0]
      });
    } catch (error) {
      // Rollback transaction in case of error
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Get active entries
exports.getActiveEntries = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req);
    
    // Filter by parking ID
    const params = [];
    let whereClause = 'WHERE e.exit_time IS NULL';
    
    if (req.query.parkingId && isValidUUID(req.query.parkingId)) {
      whereClause += ' AND e.parking_id = $1';
      params.push(req.query.parkingId);
    }
    
    // Count total active entries
    const countQuery = `
      SELECT COUNT(*) FROM entries e
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count, 10);
    
    // Get entries with details
    const entriesQuery = `
      SELECT e.id, e.entry_time, 
             c.id as car_id, c.plate_number,
             p.id as parking_id, p.code as parking_code, p.name as parking_name,
             p.location as parking_location, p.fee_per_hour,
             EXTRACT(EPOCH FROM (NOW() - e.entry_time))/3600 as current_duration
      FROM entries e
      JOIN cars c ON e.car_id = c.id
      JOIN parkings p ON e.parking_id = p.id
      ${whereClause}
      ORDER BY e.entry_time ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);
    
    const result = await db.query(entriesQuery, params);
    
    // Format entries
    const entries = result.rows.map(row => ({
      id: row.id,
      entry_time: row.entry_time,
      car: {
        id: row.car_id,
        plate_number: row.plate_number
      },
      parking: {
        id: row.parking_id,
        code: row.parking_code,
        name: row.parking_name,
        location: row.parking_location,
        fee_per_hour: row.fee_per_hour
      },
      current_duration: parseFloat(row.current_duration.toFixed(2)),
      current_charge: parseFloat((row.current_duration * row.fee_per_hour).toFixed(2))
    }));
    
    // Return paginated response
    res.status(200).json(
      paginatedResponse(entries, totalCount, page, limit)
    );
  } catch (error) {
    next(error);
  }
};
