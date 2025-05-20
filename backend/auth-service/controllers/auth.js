
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../shared/db');
const config = require('../../shared/config');
const { logUserAction } = require('../../shared/utils/logger');
const { isValidEmail, isNonEmptyString } = require('../../shared/utils/validation');

// Register a new user
exports.register = async (req, res, next) => {
  try {
    const { firstname, lastname, email, password, role = 'user' } = req.body;

    // Validate input
    const errors = [];
    if (!isNonEmptyString(firstname)) errors.push('First name is required');
    if (!isNonEmptyString(lastname)) errors.push('Last name is required');
    if (!isValidEmail(email)) errors.push('Valid email is required');
    if (!isNonEmptyString(password) || password.length < 8) errors.push('Password must be at least 8 characters');
    
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

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user into database
    const result = await db.query(
      'INSERT INTO users (firstname, lastname, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, firstname, lastname, email, role',
      [firstname, lastname, email, passwordHash, role]
    );

    // Log user registration
    await logUserAction(
      result.rows[0].id,
      'USER_REGISTERED',
      `User registered with email ${email}`
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const errors = [];
    if (!isValidEmail(email)) errors.push('Valid email is required');
    if (!isNonEmptyString(password)) errors.push('Password is required');

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    // Find user by email
    const result = await db.query(
      'SELECT id, firstname, lastname, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      config.JWT.secret,
      { expiresIn: config.JWT.expiresIn }
    );

    // Log user login
    await logUserAction(
      user.id,
      'USER_LOGIN',
      `User logged in with email ${email}`
    );

    // Return user info and token
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Verify token
exports.verifyToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const decoded = jwt.verify(token, config.JWT.secret);
    
    // Check if user still exists and has the same role
    const result = await db.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    // Check if role matches
    if (user.role !== decoded.role) {
      return res.status(403).json({ message: 'User role has changed' });
    }

    res.status(200).json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ valid: false, message: 'Invalid or expired token' });
    }
    next(error);
  }
};

// Change password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!isNonEmptyString(currentPassword) || !isNonEmptyString(newPassword)) {
      return res.status(400).json({
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters long',
      });
    }

    // Get current user
    const userResult = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(
      currentPassword,
      userResult.rows[0].password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    );

    // Log password change
    await logUserAction(
      userId,
      'PASSWORD_CHANGED',
      'User changed their password'
    );

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};