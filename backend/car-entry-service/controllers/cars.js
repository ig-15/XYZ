const db = require('../../shared/db');
const { logUserAction } = require('../../shared/utils/logger');
const { paginate, paginatedResponse } = require('../../shared/utils/pagination');
const { isNonEmptyString, isValidUUID } = require('../../shared/utils/validation');

// Get all cars (with pagination)
exports.getAllCars = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req);
    
    // Handle filters
    const filters = [];
    const params = [];
    
    if (req.query.plate) {
      filters.push('plate_number ILIKE $' + (params.length + 1));
      params.push(`%${req.query.plate}%`);
    }
    
    if (req.query.userId) {
      filters.push('user_id = $' + (params.length + 1));
      params.push(req.query.userId);
    }
    
    // Build where clause
    const whereClause = filters.length > 0 ? 'WHERE ' + filters.join(' AND ') : '';
    
    // Count total cars
    const countQuery = 'SELECT COUNT(*) FROM cars ' + whereClause;
    const countResult = await db.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count, 10);
    
    // Get cars with joined user info
    const carsQuery = `
      SELECT c.id, c.plate_number, c.user_id, 
             u.firstname, u.lastname, u.email,
             c.created_at, c.updated_at
      FROM cars c
      LEFT JOIN users u ON c.user_id = u.id
      ${whereClause} 
      ORDER BY c.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);
    
    const result = await db.query(carsQuery, params);
    
    // Format response
    const cars = result.rows.map(row => ({
      id: row.id,
      plate_number: row.plate_number,
      user_id: row.user_id,
      user: row.user_id ? {
        id: row.user_id,
        firstname: row.firstname,
        lastname: row.lastname,
        email: row.email
      } : null,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
    
    // Return paginated response
    res.status(200).json(
      paginatedResponse(cars, totalCount, page, limit)
    );
  } catch (error) {
    next(error);
  }
};

// Get car by ID
exports.getCarById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid car ID format' });
    }
    
    const result = await db.query(
      `SELECT c.id, c.plate_number, c.user_id, 
              u.firstname, u.lastname, u.email,
              c.created_at, c.updated_at
       FROM cars c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    const car = result.rows[0];
    
    // Format response
    res.status(200).json({
      id: car.id,
      plate_number: car.plate_number,
      user_id: car.user_id,
      user: car.user_id ? {
        id: car.user_id,
        firstname: car.firstname,
        lastname: car.lastname,
        email: car.email
      } : null,
      created_at: car.created_at,
      updated_at: car.updated_at
    });
  } catch (error) {
    next(error);
  }
};

// Register a new car
exports.registerCar = async (req, res, next) => {
  try {
    const { plate_number, user_id, make, model, color, year } = req.body;
    
    // Validate input
    const errors = [];
    if (!isNonEmptyString(plate_number)) {
      errors.push('Plate number is required');
    }
    
    // Validate user_id if provided
    if (user_id && !isValidUUID(user_id)) {
      errors.push('Invalid user ID format');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    
    // Check if car with plate number already exists
    const plateExists = await db.query('SELECT id FROM cars WHERE plate_number = $1', [plate_number]);
    if (plateExists.rows.length > 0) {
      return res.status(409).json({ message: 'Car with this plate number already registered' });
    }
    
    // Check if user exists if user_id is provided
    if (user_id) {
      const userExists = await db.query('SELECT id FROM users WHERE id = $1', [user_id]);
      if (userExists.rows.length === 0) {
        return res.status(400).json({ message: 'User not found' });
      }
    }
    
    // Insert car into database
    const result = await db.query(
      `INSERT INTO cars (
        plate_number, 
        user_id, 
        make, 
        model, 
        color, 
        year
      ) VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, plate_number, user_id, make, model, color, year, created_at`,
      [plate_number, user_id, make, model, color, year]
    );
    
    // Log car registration
    await logUserAction(
      req.user.id,
      'CAR_REGISTERED',
      `Car registered with plate number ${plate_number}`
    );
    
    res.status(201).json({
      message: 'Car registered successfully',
      car: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// Update a car
exports.updateCar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { plate_number, user_id } = req.body;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid car ID format' });
    }
    
    // Validate input
    const errors = [];
    if (plate_number !== undefined && !isNonEmptyString(plate_number)) {
      errors.push('Plate number cannot be empty');
    }
    
    // Validate user_id if provided
    if (user_id !== undefined && user_id !== null && !isValidUUID(user_id)) {
      errors.push('Invalid user ID format');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    
    // Check if car exists
    const carExists = await db.query('SELECT id FROM cars WHERE id = $1', [id]);
    if (carExists.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    // Check if plate number is already in use by another car
    if (plate_number) {
      const plateExists = await db.query(
        'SELECT id FROM cars WHERE plate_number = $1 AND id != $2',
        [plate_number, id]
      );
      if (plateExists.rows.length > 0) {
        return res.status(409).json({ 
          message: 'Plate number is already registered to another car' 
        });
      }
    }
    
    // Check if user exists if user_id is provided
    if (user_id) {
      const userExists = await db.query('SELECT id FROM users WHERE id = $1', [user_id]);
      if (userExists.rows.length === 0) {
        return res.status(400).json({ message: 'User not found' });
      }
    }
    
    // Build update query
    const updates = [];
    const params = [];
    let paramCount = 1;
    
    if (plate_number !== undefined) {
      updates.push(`plate_number = $${paramCount++}`);
      params.push(plate_number);
    }
    
    if (user_id !== undefined) {
      updates.push(`user_id = $${paramCount++}`);
      params.push(user_id);
    }
    
    updates.push(`updated_at = NOW()`);
    
    // Add ID as the last parameter
    params.push(id);
    
    // Execute update
    const result = await db.query(
      `UPDATE cars SET ${updates.join(', ')} 
       WHERE id = $${paramCount} 
       RETURNING id, plate_number, user_id, created_at, updated_at`,
      params
    );
    
    // Log car update
    await logUserAction(
      req.user.id, 
      'CAR_UPDATED',
      `Car ${id} updated`
    );
    
    res.status(200).json({
      message: 'Car updated successfully',
      car: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// Delete a car
exports.deleteCar = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid car ID format' });
    }
    
    // Check if car exists
    const carExists = await db.query(
      'SELECT plate_number FROM cars WHERE id = $1', 
      [id]
    );
    
    if (carExists.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    // Check if car has active entries
    const hasActiveEntries = await db.query(
      'SELECT COUNT(*) FROM entries WHERE car_id = $1 AND exit_time IS NULL',
      [id]
    );
    
    if (parseInt(hasActiveEntries.rows[0].count) > 0) {
      return res.status(400).json({
        message: 'Cannot delete car with active parking entries'
      });
    }
    
    // Delete car
    await db.query('DELETE FROM cars WHERE id = $1', [id]);
    
    // Log car deletion
    await logUserAction(
      req.user.id,
      'CAR_DELETED',
      `Car with plate number ${carExists.rows[0].plate_number} was deleted`
    );
    
    res.status(200).json({
      message: 'Car deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get car parking history
exports.getCarHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit, offset, page } = paginate(req);
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid car ID format' });
    }
    
    // Check if car exists
    const carExists = await db.query('SELECT id FROM cars WHERE id = $1', [id]);
    if (carExists.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    // Count total entries
    const countResult = await db.query(
      'SELECT COUNT(*) FROM entries WHERE car_id = $1',
      [id]
    );
    const totalCount = parseInt(countResult.rows[0].count, 10);
    
    // Get entries with parking details
    const result = await db.query(
      `SELECT e.id, e.entry_time, e.exit_time, e.charged_amount,
              p.id as parking_id, p.code as parking_code, p.name as parking_name,
              p.location as parking_location, p.fee_per_hour as parking_fee,
              t.id as ticket_id, t.issued_time as ticket_issued_time, 
              t.total_amount as ticket_total_amount
       FROM entries e
       JOIN parkings p ON e.parking_id = p.id
       LEFT JOIN tickets t ON e.id = t.entry_id
       WHERE e.car_id = $1
       ORDER BY e.entry_time DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );
    
    // Format entries
    const entries = result.rows.map(row => ({
      id: row.id,
      entry_time: row.entry_time,
      exit_time: row.exit_time,
      charged_amount: row.charged_amount,
      parking: {
        id: row.parking_id,
        code: row.parking_code,
        name: row.parking_name,
        location: row.parking_location,
        fee_per_hour: row.parking_fee
      },
      ticket: row.ticket_id ? {
        id: row.ticket_id,
        issued_time: row.ticket_issued_time,
        total_amount: row.ticket_total_amount
      } : null,
      duration: row.exit_time ? 
        Math.round((new Date(row.exit_time) - new Date(row.entry_time)) / (1000 * 60 * 60) * 10) / 10 : 
        null
    }));
    
    res.status(200).json(
      paginatedResponse(entries, totalCount, page, limit)
    );
  } catch (error) {
    next(error);
  }
};

// Search car by plate number
exports.searchCarByPlate = async (req, res, next) => {
  try {
    const { plate } = req.query;
    
    if (!plate) {
      return res.status(400).json({ message: 'Plate number is required' });
    }
    
    const result = await db.query(
      `SELECT c.id, c.plate_number, c.user_id, 
              u.firstname, u.lastname, u.email,
              c.created_at, c.updated_at
       FROM cars c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.plate_number ILIKE $1
       LIMIT 10`,
      [`%${plate}%`]
    );
    
    // Format results
    const cars = result.rows.map(car => ({
      id: car.id,
      plate_number: car.plate_number,
      user_id: car.user_id,
      user: car.user_id ? {
        id: car.user_id,
        firstname: car.firstname,
        lastname: car.lastname,
        email: car.email
      } : null,
      created_at: car.created_at,
      updated_at: car.updated_at
    }));
    
    res.status(200).json({ cars });
  } catch (error) {
    next(error);
  }
};
