const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../../shared/db');
const config = require('../../shared/config');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstname
 *               - lastname
 *               - email
 *               - password
 *             properties:
 *               firstname:
 *                 type: string
 *               lastname:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, attendant, user]
 *                 default: user
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Email already exists
 */
router.post('/register', async (req, res, next) => {
  try {
    const { firstname, lastname, email, password, role = 'user' } = req.body;

    // Validate input
    if (!firstname || !lastname || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if email already exists
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const result = await query(
      'INSERT INTO users (firstname, lastname, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, firstname, lastname, email, role, created_at',
      [firstname, lastname, email, hashedPassword, role]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      config.JWT.secret,
      { expiresIn: config.JWT.expiresIn }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        createdAt: user.created_at
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check if user exists
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      config.JWT.secret,
      { expiresIn: config.JWT.expiresIn }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        createdAt: user.created_at
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/me', async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.JWT.secret);
    
    // Get user from database
    const result = await query(
      'SELECT id, firstname, lastname, email, role, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout a user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', (req, res) => {
  // In a real implementation, you might want to invalidate the token
  // For example, by adding it to a blacklist in Redis
  // For now, we'll just return a success message
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = router;
