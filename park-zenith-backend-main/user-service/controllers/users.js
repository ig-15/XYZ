
const db = require('../../shared/db');
const { logUserAction } = require('../../shared/utils/logger');
const { paginate, paginatedResponse } = require('../../shared/utils/pagination');
const { isValidEmail, isNonEmptyString, isValidUUID } = require('../../shared/utils/validation');

// Get all users (with pagination)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req);
    
    // Handle filters
    const filters = [];
    const params = [];
    
    if (req.query.role) {
      filters.push('role = $' + (params.length + 1));
      params.push(req.query.role);
    }
    
    if (req.query.search) {
      const search = `%${req.query.search}%`;
      filters.push('(firstname ILIKE $' + (params.length + 1) + 
                  ' OR lastname ILIKE $' + (params.length + 1) + 
                  ' OR email ILIKE $' + (params.length + 1) + ')');
      params.push(search);
    }
    
    // Build where clause
    const whereClause = filters.length > 0 ? 'WHERE ' + filters.join(' AND ') : '';
    
    // Count total users
    const countQuery = 'SELECT COUNT(*) FROM users ' + whereClause;
    const countResult = await db.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count, 10);
    
    // Get users
    const usersQuery = `
      SELECT id, firstname, lastname, email, role, created_at, updated_at
      FROM users 
      ${whereClause} 
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);
    
    const result = await db.query(usersQuery, params);
    
    // Return paginated response
    res.status(200).json(
      paginatedResponse(result.rows, totalCount, page, limit)
    );
  } catch (error) {
    next(error);
  }
};

// Get user by ID
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    const result = await db.query(
      'SELECT id, firstname, lastname, email, role, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Create a new user
exports.createUser = async (req, res, next) => {
  try {
    const { firstname, lastname, email, role = 'user' } = req.body;
    
    // Validate input
    const errors = [];
    if (!isNonEmptyString(firstname)) errors.push('First name is required');
    if (!isNonEmptyString(lastname)) errors.push('Last name is required');
    if (!isValidEmail(email)) errors.push('Valid email is required');
    
    // Check valid role
    const validRoles = ['admin', 'attendant', 'user'];
    if (!validRoles.includes(role)) errors.push('Invalid role');
    
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    
    // Check if user already exists
    const userExists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }
    
    // Generate a temporary password (would be replaced with a more secure solution in production)
    const tempPassword = Math.random().toString(36).slice(-8);
    
    // Insert user into database (would normally hash the password, but that's handled by Auth service)
    const result = await db.query(
      `INSERT INTO users 
       (firstname, lastname, email, password_hash, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, firstname, lastname, email, role, created_at`,
      [firstname, lastname, email, tempPassword, role]
    );
    
    // Log user creation
    await logUserAction(
      req.user.id,
      'USER_CREATED',
      `User created with email ${email} and role ${role}`
    );
    
    res.status(201).json({
      message: 'User created successfully',
      user: result.rows[0],
      temporaryPassword: tempPassword // In production, would send this via email instead
    });
  } catch (error) {
    next(error);
  }
};

// Update user
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstname, lastname, email, role } = req.body;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    // Validate input
    const errors = [];
    if (firstname && !isNonEmptyString(firstname)) errors.push('First name cannot be empty');
    if (lastname && !isNonEmptyString(lastname)) errors.push('Last name cannot be empty');
    if (email && !isValidEmail(email)) errors.push('Valid email is required');
    
    // Check valid role if provided
    const validRoles = ['admin', 'attendant', 'user'];
    if (role && !validRoles.includes(role)) errors.push('Invalid role');
    
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    
    // Check if user exists
    const userExists = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if email already exists for another user
    if (email) {
      const emailExists = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (emailExists.rows.length > 0) {
        return res.status(409).json({ message: 'Email is already in use by another user' });
      }
    }
    
    // Build update query
    const updates = [];
    const params = [];
    let paramCount = 1;
    
    if (firstname) {
      updates.push(`firstname = $${paramCount++}`);
      params.push(firstname);
    }
    
    if (lastname) {
      updates.push(`lastname = $${paramCount++}`);
      params.push(lastname);
    }
    
    if (email) {
      updates.push(`email = $${paramCount++}`);
      params.push(email);
    }
    
    if (role) {
      updates.push(`role = $${paramCount++}`);
      params.push(role);
    }
    
    updates.push(`updated_at = NOW()`);
    
    // Add ID as the last parameter
    params.push(id);
    
    // Execute update
    const result = await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} 
       RETURNING id, firstname, lastname, email, role, created_at, updated_at`,
      params
    );
    
    // Log user update
    await logUserAction(
      req.user.id, 
      'USER_UPDATED',
      `User ${id} updated`
    );
    
    res.status(200).json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// Delete user
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    // Check if user exists
    const userExists = await db.query('SELECT email FROM users WHERE id = $1', [id]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent deleting own account
    if (id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    // Delete user
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    
    // Log user deletion
    await logUserAction(
      req.user.id,
      'USER_DELETED',
      `User with email ${userExists.rows[0].email} was deleted`
    );
    
    res.status(200).json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get user activity logs
exports.getUserLogs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit, offset, page } = paginate(req);
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    // Check if user exists
    const userExists = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Count total logs
    const countResult = await db.query(
      'SELECT COUNT(*) FROM logs WHERE user_id = $1',
      [id]
    );
    const totalCount = parseInt(countResult.rows[0].count, 10);
    
    // Get logs with pagination
    const result = await db.query(
      `SELECT id, action, description, timestamp 
       FROM logs 
       WHERE user_id = $1 
       ORDER BY timestamp DESC 
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );
    
    res.status(200).json(
      paginatedResponse(result.rows, totalCount, page, limit)
    );
  } catch (error) {
    next(error);
  }
};

// Update user role
exports.updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    // Validate role
    const validRoles = ['admin', 'attendant', 'user'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ message: 'Valid role is required' });
    }
    
    // Check if user exists
    const userExists = await db.query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if role is already assigned
    if (userExists.rows[0].role === role) {
      return res.status(200).json({
        message: 'User already has this role',
        user: { id, role }
      });
    }
    
    // Update user role
    const result = await db.query(
      `UPDATE users SET role = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING id, role, updated_at`,
      [role, id]
    );
    
    // Log role update
    await logUserAction(
      req.user.id,
      'USER_ROLE_UPDATED',
      `User ${id} role updated to ${role}`
    );
    
    res.status(200).json({
      message: 'User role updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
