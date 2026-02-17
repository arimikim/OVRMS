/**
 * Vehicle Routes
 */

const express = require('express');
const router = express.Router();

const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { AppError } = require('../middleware/errorHandler');
const { logAudit, parsePagination, buildPaginationResponse } = require('../utils/helpers');

/**
 * @route   GET /api/vehicles/available
 * @desc    Get all available vehicles
 * @access  Private
 */
router.get('/available', authenticateToken, async (req, res, next) => {
  try {
    const { type, hub } = req.query;
    
    let queryText = 'SELECT * FROM available_vehicles WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (type) {
      queryText += ` AND vehicle_type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    if (hub) {
      queryText += ` AND hub_name = $${paramCount}`;
      params.push(hub);
      paramCount++;
    }

    queryText += ' ORDER BY vehicle_name';

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/vehicles
 * @desc    Get all vehicles (admin only)
 * @access  Private/Admin
 */
router.get('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req);
    const { status, type } = req.query;

    let queryText = `
      SELECT v.*, h.hub_name
      FROM vehicles v
      LEFT JOIN mobility_hubs h ON v.current_hub_id = h.hub_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      queryText += ` AND v.vehicle_status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (type) {
      queryText += ` AND v.vehicle_type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    // Get total count
    const countResult = await query(
      queryText.replace('v.*, h.hub_name', 'COUNT(*)'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    queryText += ` ORDER BY v.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    res.json(buildPaginationResponse(result.rows, total, page, limit));
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/vehicles/:id
 * @desc    Get single vehicle
 * @access  Private
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT v.*, h.hub_name, h.latitude, h.longitude
       FROM vehicles v
       LEFT JOIN mobility_hubs h ON v.current_hub_id = h.hub_id
       WHERE v.vehicle_id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Vehicle not found', 404, 'VEHICLE_NOT_FOUND');
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/vehicles
 * @desc    Create new vehicle
 * @access  Private/Admin
 */
router.post('/', authenticateToken, requireAdmin, validate(schemas.createVehicle), async (req, res, next) => {
  try {
    const {
      vehicleType, vehicleName, plateNumber, currentHubId, dailyRate,
      vehicleMake, vehicleModel, yearOfManufacture, color, seatingCapacity,
      fuelType, notes
    } = req.body;

    const result = await query(
      `INSERT INTO vehicles (
        vehicle_type, vehicle_name, plate_number, current_hub_id, vehicle_status,
        daily_rate, vehicle_make, vehicle_model, year_of_manufacture, color,
        seating_capacity, fuel_type, notes, created_by
      ) VALUES ($1, $2, $3, $4, 'available', $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [vehicleType, vehicleName, plateNumber, currentHubId, dailyRate, vehicleMake,
       vehicleModel, yearOfManufacture, color, seatingCapacity, fuelType, notes, req.user.userId]
    );

    await logAudit(
      req.user.userId,
      'vehicle_created',
      'vehicle',
      result.rows[0].vehicle_id,
      `Created vehicle: ${vehicleName}`,
      req.ip
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/vehicles/:id
 * @desc    Update vehicle
 * @access  Private/Admin
 */
router.put('/:id', authenticateToken, requireAdmin, validate(schemas.updateVehicle), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const fields = Object.keys(updates);
    if (fields.length === 0) {
      throw new AppError('No fields to update', 400, 'NO_UPDATE_FIELDS');
    }

    const values = fields.map(field => updates[field]);
    const setClause = fields.map((field, idx) => {
      // Convert camelCase to snake_case for database
      const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
      return `${dbField} = $${idx + 1}`;
    }).join(', ');

    const result = await query(
      `UPDATE vehicles SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE vehicle_id = $${fields.length + 1} RETURNING *`,
      [...values, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Vehicle not found', 404, 'VEHICLE_NOT_FOUND');
    }

    await logAudit(
      req.user.userId,
      'vehicle_updated',
      'vehicle',
      id,
      `Updated vehicle: ${result.rows[0].vehicle_name}`,
      req.ip
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/vehicles/:id
 * @desc    Delete vehicle
 * @access  Private/Admin
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    // Check for active bookings
    const activeBookings = await query(
      `SELECT COUNT(*) FROM bookings 
       WHERE vehicle_id = $1 AND booking_status IN ('pending', 'approved', 'active')`,
      [req.params.id]
    );

    if (parseInt(activeBookings.rows[0].count) > 0) {
      throw new AppError('Cannot delete vehicle with active bookings', 400, 'HAS_ACTIVE_BOOKINGS');
    }

    const result = await query(
      'DELETE FROM vehicles WHERE vehicle_id = $1 RETURNING vehicle_name',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Vehicle not found', 404, 'VEHICLE_NOT_FOUND');
    }

    await logAudit(
      req.user.userId,
      'vehicle_deleted',
      'vehicle',
      req.params.id,
      `Deleted vehicle: ${result.rows[0].vehicle_name}`,
      req.ip
    );

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/vehicles/:id/history
 * @desc    Get vehicle rental history
 * @access  Private/Admin
 */
router.get('/:id/history', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT b.*, u.full_name as user_name
       FROM bookings b
       JOIN users u ON b.user_id = u.user_id
       WHERE b.vehicle_id = $1
       ORDER BY b.created_at DESC`,
      [req.params.id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
