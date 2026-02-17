/**
 * Authentication Routes
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

const { query } = require('../config/database');
const config = require('../config/config');
const { validate, schemas } = require('../middleware/validation');
const { AppError } = require('../middleware/errorHandler');
const { logAudit } = require('../utils/helpers');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validate(schemas.register), async (req, res, next) => {
  try {
    const { username, email, password, fullName, phoneNumber, organization, employeeId } = req.body;

    // Check if user exists
    const existingUser = await query(
      'SELECT user_id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('Username or email already exists', 409, 'USER_EXISTS');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);

    // Insert user
    const result = await query(
      `INSERT INTO users (username, email, password_hash, full_name, phone_number, role, organization, employee_id)
       VALUES ($1, $2, $3, $4, $5, 'user', $6, $7)
       RETURNING user_id, username, email, full_name, role`,
      [username, email, passwordHash, fullName, phoneNumber, organization, employeeId]
    );

    const user = result.rows[0];

    // Log audit
    await logAudit(user.user_id, 'user_registered', 'user', user.user_id, 'New user registration', req.ip);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validate(schemas.login), async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Get user
    const result = await query(
      'SELECT user_id, username, email, password_hash, full_name, role, is_active FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const user = result.rows[0];

    // Check if active
    if (!user.is_active) {
      throw new AppError('Account is deactivated', 403, 'ACCOUNT_INACTIVE');
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Update last login
    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1', [user.user_id]);

    // Generate token
    const token = jwt.sign(
      { userId: user.user_id, username: user.username, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Log audit
    await logAudit(user.user_id, 'user_login', 'user', user.user_id, 'User login', req.ip);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', async (req, res, next) => {
  try {
    // TODO: Implement password change
    res.json({ message: 'Password change endpoint - to be implemented' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', async (req, res, next) => {
  try {
    // TODO: Implement password reset
    res.json({ message: 'Password reset endpoint - to be implemented' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
