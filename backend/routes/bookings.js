/**
 * Booking Routes
 */

const express = require('express');
const router = express.Router();

const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { AppError } = require('../middleware/errorHandler');
const { logAudit, calculateRentalCost, checkVehicleAvailability } = require('../utils/helpers');
const { sendBookingConfirmation, sendBookingApproval, sendBookingRejection } = require('../utils/emailService');

/**
 * @route   POST /api/bookings
 * @desc    Create booking request
 * @access  Private
 */
router.post('/', authenticateToken, validate(schemas.createBooking), async (req, res, next) => {
  try {
    const {
      vehicleId, pickupHubId, dropoffHubId, requestedStartDate,
      requestedEndDate, purposeOfRental, specialRequirements
    } = req.body;

    // Check vehicle exists and is available
    const vehicle = await query(
      'SELECT vehicle_id, daily_rate, vehicle_status FROM vehicles WHERE vehicle_id = $1',
      [vehicleId]
    );

    if (vehicle.rows.length === 0) {
      throw new AppError('Vehicle not found', 404, 'VEHICLE_NOT_FOUND');
    }

    if (vehicle.rows[0].vehicle_status !== 'available') {
      throw new AppError('Vehicle not available', 400, 'VEHICLE_NOT_AVAILABLE');
    }

    // Check date availability
    const isAvailable = await checkVehicleAvailability(vehicleId, requestedStartDate, requestedEndDate);
    if (!isAvailable) {
      throw new AppError('Vehicle already booked for selected dates', 400, 'DATE_CONFLICT');
    }

    // Calculate cost
    const estimatedCost = await calculateRentalCost(vehicleId, requestedStartDate, requestedEndDate);

    // Create booking
    const result = await query(
      `INSERT INTO bookings (
        vehicle_id, user_id, pickup_hub_id, dropoff_hub_id,
        requested_start_date, requested_end_date, booking_status,
        estimated_cost, purpose_of_rental, special_requirements
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9)
      RETURNING *`,
      [vehicleId, req.user.userId, pickupHubId, dropoffHubId,
       requestedStartDate, requestedEndDate, estimatedCost,
       purposeOfRental, specialRequirements]
    );

    await logAudit(
      req.user.userId,
      'booking_created',
      'booking',
      result.rows[0].booking_id,
      'New booking request',
      req.ip
    );

    // Send confirmation email to user
    try {
      const bookingData = result.rows[0];
      const userResult = await query('SELECT email, full_name FROM users WHERE user_id = $1', [req.user.userId]);
      const vehicleResult = await query('SELECT vehicle_name, plate_number FROM vehicles WHERE vehicle_id = $1', [vehicleId]);
      const pickupHubResult = await query('SELECT hub_name FROM mobility_hubs WHERE hub_id = $1', [pickupHubId]);
      const dropoffHubResult = await query('SELECT hub_name FROM mobility_hubs WHERE hub_id = $1', [dropoffHubId]);

      if (userResult.rows.length > 0) {
        await sendBookingConfirmation(userResult.rows[0].email, {
          bookingId: bookingData.booking_id,
          userName: userResult.rows[0].full_name,
          vehicleName: vehicleResult.rows[0]?.vehicle_name || 'N/A',
          plateNumber: vehicleResult.rows[0]?.plate_number || 'N/A',
          pickupHub: pickupHubResult.rows[0]?.hub_name || 'N/A',
          dropoffHub: dropoffHubResult.rows[0]?.hub_name || 'N/A',
          startDate: requestedStartDate,
          endDate: requestedEndDate,
          estimatedCost: estimatedCost,
        });
      }
    } catch (emailError) {
      console.error('Failed to send booking confirmation email:', emailError.message);
      // Don't fail the booking if email fails
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/bookings/my-bookings
 * @desc    Get user's bookings
 * @access  Private
 */
router.get('/my-bookings', authenticateToken, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT b.*, v.vehicle_name, v.plate_number, v.vehicle_type,
              pickup.hub_name as pickup_hub_name, dropoff.hub_name as dropoff_hub_name
       FROM bookings b
       JOIN vehicles v ON b.vehicle_id = v.vehicle_id
       JOIN mobility_hubs pickup ON b.pickup_hub_id = pickup.hub_id
       JOIN mobility_hubs dropoff ON b.dropoff_hub_id = dropoff.hub_id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.userId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings (admin)
 * @access  Private/Admin
 */
router.get('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.query;

    let queryText = `
      SELECT b.*, v.vehicle_name, v.plate_number, u.full_name as user_name,
             pickup.hub_name as pickup_hub_name, dropoff.hub_name as dropoff_hub_name,
             CASE WHEN b.booking_status = 'active' AND b.requested_end_date < CURRENT_DATE 
                  THEN true ELSE false END as is_overdue
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.vehicle_id
      JOIN users u ON b.user_id = u.user_id
      JOIN mobility_hubs pickup ON b.pickup_hub_id = pickup.hub_id
      JOIN mobility_hubs dropoff ON b.dropoff_hub_id = dropoff.hub_id
    `;

    const params = [];
    if (status) {
      queryText += ' WHERE b.booking_status = $1';
      params.push(status);
    }

    queryText += ' ORDER BY b.created_at DESC';

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/bookings/:id
 * @desc    Get single booking
 * @access  Private
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT b.*, v.vehicle_name, v.plate_number, v.vehicle_type,
              u.full_name as user_name, u.email, u.phone_number,
              pickup.hub_name as pickup_hub_name, dropoff.hub_name as dropoff_hub_name
       FROM bookings b
       JOIN vehicles v ON b.vehicle_id = v.vehicle_id
       JOIN users u ON b.user_id = u.user_id
       JOIN mobility_hubs pickup ON b.pickup_hub_id = pickup.hub_id
       JOIN mobility_hubs dropoff ON b.dropoff_hub_id = dropoff.hub_id
       WHERE b.booking_id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    const booking = result.rows[0];

    // Check access rights
    if (req.user.role !== 'admin' && booking.user_id !== req.user.userId) {
      throw new AppError('Access denied', 403, 'ACCESS_DENIED');
    }

    res.json(booking);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/bookings/:id/approve
 * @desc    Approve booking
 * @access  Private/Admin
 */
router.post('/:id/approve', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const result = await query(
      'SELECT approve_booking($1, $2) as success',
      [req.params.id, req.user.userId]
    );

    if (!result.rows[0].success) {
      throw new AppError('Cannot approve - vehicle not available', 400, 'APPROVAL_FAILED');
    }

    await logAudit(
      req.user.userId,
      'booking_approved',
      'booking',
      req.params.id,
      'Booking approved',
      req.ip
    );

    // Send approval email to user
    try {
      const bookingDetails = await query(
        `SELECT b.*, v.vehicle_name, v.plate_number, u.email, u.full_name,
                pickup.hub_name as pickup_hub_name, dropoff.hub_name as dropoff_hub_name
         FROM bookings b
         JOIN vehicles v ON b.vehicle_id = v.vehicle_id
         JOIN users u ON b.user_id = u.user_id
         JOIN mobility_hubs pickup ON b.pickup_hub_id = pickup.hub_id
         JOIN mobility_hubs dropoff ON b.dropoff_hub_id = dropoff.hub_id
         WHERE b.booking_id = $1`,
        [req.params.id]
      );

      if (bookingDetails.rows.length > 0) {
        const booking = bookingDetails.rows[0];
        await sendBookingApproval(booking.email, {
          bookingId: booking.booking_id,
          userName: booking.full_name,
          vehicleName: booking.vehicle_name,
          plateNumber: booking.plate_number,
          pickupHub: booking.pickup_hub_name,
          dropoffHub: booking.dropoff_hub_name,
          startDate: booking.requested_start_date,
          endDate: booking.requested_end_date,
          estimatedCost: booking.estimated_cost,
        });
      }
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError.message);
    }

    res.json({ message: 'Booking approved successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/bookings/:id/reject
 * @desc    Reject booking
 * @access  Private/Admin
 */
router.post('/:id/reject', authenticateToken, requireAdmin, validate(schemas.rejectBooking), async (req, res, next) => {
  try {
    const { reason } = req.body;

    await query(
      'SELECT reject_booking($1, $2, $3)',
      [req.params.id, req.user.userId, reason]
    );

    await logAudit(
      req.user.userId,
      'booking_rejected',
      'booking',
      req.params.id,
      `Booking rejected: ${reason}`,
      req.ip
    );

    // Send rejection email to user
    try {
      const bookingDetails = await query(
        `SELECT b.*, v.vehicle_name, u.email, u.full_name
         FROM bookings b
         JOIN vehicles v ON b.vehicle_id = v.vehicle_id
         JOIN users u ON b.user_id = u.user_id
         WHERE b.booking_id = $1`,
        [req.params.id]
      );

      if (bookingDetails.rows.length > 0) {
        const booking = bookingDetails.rows[0];
        await sendBookingRejection(booking.email, {
          bookingId: booking.booking_id,
          userName: booking.full_name,
          vehicleName: booking.vehicle_name,
          startDate: booking.requested_start_date,
          endDate: booking.requested_end_date,
        }, reason);
      }
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError.message);
    }

    res.json({ message: 'Booking rejected successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/bookings/:id/cancel
 * @desc    Cancel booking (user)
 * @access  Private
 */
router.post('/:id/cancel', authenticateToken, async (req, res, next) => {
  try {
    // Verify ownership
    const booking = await query(
      'SELECT user_id, booking_status FROM bookings WHERE booking_id = $1',
      [req.params.id]
    );

    if (booking.rows.length === 0) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    if (booking.rows[0].user_id !== req.user.userId && req.user.role !== 'admin') {
      throw new AppError('Access denied', 403, 'ACCESS_DENIED');
    }

    if (!['pending', 'approved'].includes(booking.rows[0].booking_status)) {
      throw new AppError('Cannot cancel booking in current status', 400, 'INVALID_STATUS');
    }

    // Cancel booking
    await query(
      `UPDATE bookings 
       SET booking_status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE booking_id = $1`,
      [req.params.id]
    );

    await logAudit(
      req.user.userId,
      'booking_cancelled',
      'booking',
      req.params.id,
      'Booking cancelled by user',
      req.ip
    );

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/bookings/pending/queue
 * @desc    Get pending approval queue
 * @access  Private/Admin
 */
router.get('/pending/queue', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM pending_approvals');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/bookings/active/rentals
 * @desc    Get active rentals
 * @access  Private/Admin
 */
router.get('/active/rentals', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM active_rentals');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;