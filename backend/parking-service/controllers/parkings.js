
const db = require('../../shared/db');
const { logUserAction } = require('../../shared/utils/logger');
const { paginate, paginatedResponse } = require('../../shared/utils/pagination');
const { isNonEmptyString, isPositiveNumber, isValidUUID } = require('../../shared/utils/validation');

// Get all parking lots (with pagination)
exports.getAllParkings = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req);
    
    // Handle filters
    const filters = [];
    const params = [];
    
    if (req.query.search) {
      const search = `%${req.query.search}%`;
      filters.push(
        '(name ILIKE $' + (params.length + 1) + 
        ' OR code ILIKE $' + (params.length + 1) + 
        ' OR location ILIKE $' + (params.length + 1) + ')'
      );
      params.push(search);
    }
    
    // Check availability filter
    if (req.query.hasSpace === 'true') {
      filters.push('available_spaces > 0');
    } else if (req.query.hasSpace === 'false') {
      filters.push('available_spaces = 0');
    }
    
    // Build where clause
    const whereClause = filters.length > 0 ? 'WHERE ' + filters.join(' AND ') : '';
    
    // Count total parking lots
    const countQuery = 'SELECT COUNT(*) FROM parkings ' + whereClause;
    const countResult = await db.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count, 10);
    
    // Get parking lots
    const parkingsQuery = `
      SELECT id, code, name, location, total_spaces, available_spaces, fee_per_hour, 
             created_at, updated_at
      FROM parkings 
      ${whereClause} 
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);
    
    const result = await db.query(parkingsQuery, params);
    
    // Return paginated response
    res.status(200).json(
      paginatedResponse(result.rows, totalCount, page, limit)
    );
  } catch (error) {
    next(error);
  }
};

// Get parking lot by ID
exports.getParkingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid parking ID format' });
    }
    
    const result = await db.query(
      `SELECT id, code, name, location, total_spaces, available_spaces, fee_per_hour,
              created_at, updated_at
       FROM parkings WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Parking lot not found' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Create a new parking lot
exports.createParking = async (req, res, next) => {
  try {
    const { code, name, location, total_spaces, fee_per_hour } = req.body;
    
    // Validate input
    const errors = [];
    if (!isNonEmptyString(code)) errors.push('Code is required');
    if (!isNonEmptyString(name)) errors.push('Name is required');
    if (!isNonEmptyString(location)) errors.push('Location is required');
    
    if (!isPositiveNumber(total_spaces)) {
      errors.push('Total spaces must be a positive number');
    }
    
    if (!isPositiveNumber(fee_per_hour)) {
      errors.push('Fee per hour must be a positive number');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    
    // Check if code already exists
    const codeExists = await db.query('SELECT id FROM parkings WHERE code = $1', [code]);
    if (codeExists.rows.length > 0) {
      return res.status(409).json({ message: 'Parking lot already exists with this code' });
    }
    
    // Initially available spaces equal total spaces
    const available_spaces = total_spaces;
    
    // Insert parking lot into database
    const result = await db.query(
      `INSERT INTO parkings 
       (code, name, location, total_spaces, available_spaces, fee_per_hour) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, code, name, location, total_spaces, available_spaces, fee_per_hour, created_at`,
      [code, name, location, total_spaces, available_spaces, fee_per_hour]
    );
    
    // Log parking creation
    await logUserAction(
      req.user.id,
      'PARKING_CREATED',
      `Parking lot created with code ${code}`
    );
    
    res.status(201).json({
      message: 'Parking lot created successfully',
      parking: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// Update a parking lot
exports.updateParking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, location, total_spaces, fee_per_hour } = req.body;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid parking ID format' });
    }
    
    // Validate input
    const errors = [];
    if (name !== undefined && !isNonEmptyString(name)) {
      errors.push('Name cannot be empty');
    }
    
    if (location !== undefined && !isNonEmptyString(location)) {
      errors.push('Location cannot be empty');
    }
    
    if (total_spaces !== undefined && !isPositiveNumber(total_spaces)) {
      errors.push('Total spaces must be a positive number');
    }
    
    if (fee_per_hour !== undefined && !isPositiveNumber(fee_per_hour)) {
      errors.push('Fee per hour must be a positive number');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    
    // Check if parking lot exists and get current values
    const existingResult = await db.query(
      'SELECT id, available_spaces, total_spaces FROM parkings WHERE id = $1',
      [id]
    );
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Parking lot not found' });
    }
    
    const existing = existingResult.rows[0];
    
    // Calculate available spaces if total_spaces changes
    let available_spaces = existing.available_spaces;
    if (total_spaces !== undefined) {
      // Calculate current occupancy
      const currentOccupancy = existing.total_spaces - existing.available_spaces;
      
      // New available spaces = new total - current occupancy
      available_spaces = Math.max(0, total_spaces - currentOccupancy);
      
      // Cannot have more occupancy than total spaces
      if (available_spaces < 0) {
        return res.status(400).json({
          message: 'Cannot reduce total spaces below current occupancy'
        });
      }
    }
    
    // Build update query
    const updates = [];
    const params = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      params.push(name);
    }
    
    if (location !== undefined) {
      updates.push(`location = $${paramCount++}`);
      params.push(location);
    }
    
    if (total_spaces !== undefined) {
      updates.push(`total_spaces = $${paramCount++}`);
      params.push(total_spaces);
      
      updates.push(`available_spaces = $${paramCount++}`);
      params.push(available_spaces);
    }
    
    if (fee_per_hour !== undefined) {
      updates.push(`fee_per_hour = $${paramCount++}`);
      params.push(fee_per_hour);
    }
    
    updates.push(`updated_at = NOW()`);
    
    // Add ID as the last parameter
    params.push(id);
    
    // Execute update
    const result = await db.query(
      `UPDATE parkings SET ${updates.join(', ')} WHERE id = $${paramCount} 
       RETURNING id, code, name, location, total_spaces, available_spaces, fee_per_hour,
                created_at, updated_at`,
      params
    );
    
    // Log parking update
    await logUserAction(
      req.user.id, 
      'PARKING_UPDATED',
      `Parking lot ${id} updated`
    );
    
    res.status(200).json({
      message: 'Parking lot updated successfully',
      parking: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// Delete a parking lot
exports.deleteParking = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid parking ID format' });
    }
    
    // Check if parking lot exists
    const parkingExists = await db.query('SELECT code FROM parkings WHERE id = $1', [id]);
    if (parkingExists.rows.length === 0) {
      return res.status(404).json({ message: 'Parking lot not found' });
    }
    
    // Check if parking lot has active entries
    const hasEntries = await db.query(
      'SELECT COUNT(*) FROM entries WHERE parking_id = $1 AND exit_time IS NULL',
      [id]
    );
    
    if (parseInt(hasEntries.rows[0].count) > 0) {
      return res.status(400).json({
        message: 'Cannot delete parking lot with active entries'
      });
    }
    
    // Delete parking lot
    await db.query('DELETE FROM parkings WHERE id = $1', [id]);
    
    // Log parking deletion
    await logUserAction(
      req.user.id,
      'PARKING_DELETED',
      `Parking lot with code ${parkingExists.rows[0].code} was deleted`
    );
    
    res.status(200).json({
      message: 'Parking lot deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Update available spaces
exports.updateAvailableSpaces = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { operation } = req.body;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid parking ID format' });
    }
    
    if (!['increment', 'decrement'].includes(operation)) {
      return res.status(400).json({ message: 'Operation must be either increment or decrement' });
    }
    
    // Get current parking data
    const parkingResult = await db.query(
      'SELECT id, available_spaces, total_spaces FROM parkings WHERE id = $1',
      [id]
    );
    
    if (parkingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Parking lot not found' });
    }
    
    const parking = parkingResult.rows[0];
    
    // Update available spaces
    let newAvailableSpaces;
    if (operation === 'increment') {
      // Ensure we don't exceed total spaces
      newAvailableSpaces = Math.min(parking.available_spaces + 1, parking.total_spaces);
      
      if (newAvailableSpaces > parking.total_spaces) {
        return res.status(400).json({
          message: 'Cannot exceed total spaces'
        });
      }
    } else {
      // Ensure we don't go below 0
      newAvailableSpaces = Math.max(parking.available_spaces - 1, 0);
      
      if (newAvailableSpaces < 0) {
        return res.status(400).json({
          message: 'No available spaces'
        });
      }
    }
    
    // Update database
    const result = await db.query(
      `UPDATE parkings SET available_spaces = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, code, name, available_spaces, total_spaces`,
      [newAvailableSpaces, id]
    );
    
    // Log space update
    await logUserAction(
      req.user.id,
      `PARKING_SPACES_${operation.toUpperCase()}D`,
      `Available spaces ${operation}ed for parking ${id}`
    );
    
    res.status(200).json({
      message: `Available spaces ${operation}ed successfully`,
      parking: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// Get parking availability
exports.getParkingAvailability = async (req, res, next) => {
  try {
    // Get all parking lots with availability info
    const result = await db.query(
      `SELECT id, code, name, location, total_spaces, available_spaces,
              (available_spaces = 0) as is_full,
              ((available_spaces::float / total_spaces::float) * 100) as availability_percentage
       FROM parkings
       ORDER BY name ASC`
    );
    
    res.status(200).json({
      parkings: result.rows
    });
  } catch (error) {
    next(error);
  }
};