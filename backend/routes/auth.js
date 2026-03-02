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
const { sendPasswordResetEmail } = require('../utils/emailService');
const crypto = require('crypto');

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
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400, 'EMAIL_REQUIRED');
    }

    // Check if user exists
    const result = await query(
      'SELECT user_id, username, email, full_name FROM users WHERE email = $1',
      [email]
    );

    // Always return success (don't reveal if email exists)
    if (result.rows.length === 0) {
      return res.json({ message: 'If that email exists, a password reset link has been sent' });
    }

    const user = result.rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE user_id = $3',
      [resetTokenHash, resetTokenExpiry, user.user_id]
    );

    // Send reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.full_name);
      await logAudit(user.user_id, 'password_reset_requested', 'user', user.user_id, 'Password reset requested', req.ip);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError.message);
      throw new AppError('Failed to send reset email. Please try again later.', 500, 'EMAIL_FAILED');
    }

    res.json({ message: 'If that email exists, a password reset link has been sent' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw new AppError('Token and new password are required', 400, 'INVALID_REQUEST');
    }

    if (newPassword.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400, 'PASSWORD_TOO_SHORT');
    }

    // Find user with valid reset token
    const result = await query(
      'SELECT user_id, reset_token, reset_token_expiry, full_name FROM users WHERE reset_token_expiry > NOW()'
    );

    let matchedUser = null;
    for (const user of result.rows) {
      const isValid = await bcrypt.compare(token, user.reset_token);
      if (isValid) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      throw new AppError('Invalid or expired reset token', 400, 'INVALID_TOKEN');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, config.security.bcryptRounds);

    // Update password and clear reset token
    await query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE user_id = $2',
      [passwordHash, matchedUser.user_id]
    );

    await logAudit(matchedUser.user_id, 'password_reset_completed', 'user', matchedUser.user_id, 'Password reset completed', req.ip);

    res.json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
