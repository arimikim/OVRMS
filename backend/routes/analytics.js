/**
 * Analytics Routes
 */

const express = require("express");
const router = express.Router();

const { query } = require("../config/database");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

/**
 * @route   GET /api/analytics/fleet-stats
 * @desc    Get fleet statistics
 * @access  Private/Admin
 */
router.get(
  "/fleet-stats",
  authenticateToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      const result = await query("SELECT * FROM fleet_statistics");
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route   GET /api/analytics/booking-trends
 * @desc    Get booking trends
 * @access  Private/Admin
 */
router.get(
  "/booking-trends",
  authenticateToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { days = 30 } = req.query;
      const result = await query(
        `SELECT * FROM booking_trends 
       WHERE booking_date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
       ORDER BY booking_date DESC`,
      );
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route   GET /api/analytics/revenue
 * @desc    Get revenue report
 * @access  Private/Admin
 */
router.get(
  "/revenue",
  authenticateToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { months = 12 } = req.query;
      const result = await query("SELECT * FROM revenue_report LIMIT $1", [
        parseInt(months),
      ]);
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get dashboard summary
 * @access  Private/Admin
 */
router.get(
  "/dashboard",
  authenticateToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      // Get various statistics
      const [
        totalVehicles,
        availableVehicles,
        activeBookings,
        pendingApprovals,
        overdueBookings,
        todayBookings,
        totalUsers,
        monthlyRevenue,
      ] = await Promise.all([
        query("SELECT COUNT(*) FROM vehicles"),
        query(
          "SELECT COUNT(*) FROM vehicles WHERE vehicle_status = 'available'",
        ),
        query("SELECT COUNT(*) FROM bookings WHERE booking_status = 'active'"),
        query("SELECT COUNT(*) FROM bookings WHERE booking_status = 'pending'"),
        query(
          "SELECT COUNT(*) FROM bookings WHERE is_overdue = true AND booking_status = 'active'",
        ),
        query(
          "SELECT COUNT(*) FROM bookings WHERE DATE(created_at) = CURRENT_DATE",
        ),
        query(
          "SELECT COUNT(*) FROM users WHERE is_active = true AND role = 'user'",
        ),
        query(`SELECT COALESCE(SUM(actual_cost + overdue_charges), 0) as revenue 
             FROM bookings 
             WHERE booking_status = 'completed' 
             AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`),
      ]);

      res.json({
        fleet: {
          total: parseInt(totalVehicles.rows[0].count),
          available: parseInt(availableVehicles.rows[0].count),
          rented: parseInt(activeBookings.rows[0].count),
        },
        bookings: {
          active: parseInt(activeBookings.rows[0].count),
          pending: parseInt(pendingApprovals.rows[0].count),
          overdue: parseInt(overdueBookings.rows[0].count),
          today: parseInt(todayBookings.rows[0].count),
        },
        users: {
          total: parseInt(totalUsers.rows[0].count),
        },
        revenue: {
          monthly: parseFloat(monthlyRevenue.rows[0].revenue),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route   GET /api/analytics/popular-vehicles
 * @desc    Get most popular vehicles
 * @access  Private/Admin
 */
router.get(
  "/popular-vehicles",
  authenticateToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      const result = await query(`
      SELECT v.vehicle_id, v.vehicle_name, v.vehicle_type, v.plate_number,
             COUNT(b.booking_id) as booking_count,
             AVG(EXTRACT(DAY FROM (b.requested_end_date - b.requested_start_date))) as avg_rental_days
      FROM vehicles v
      LEFT JOIN bookings b ON v.vehicle_id = b.vehicle_id 
        AND b.booking_status IN ('completed', 'active')
      WHERE v.is_active = true
      GROUP BY v.vehicle_id
      ORDER BY booking_count DESC
      LIMIT 10
    `);
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route   GET /api/analytics/hub-utilization
 * @desc    Get hub utilization statistics
 * @access  Private/Admin
 */
router.get(
  "/hub-utilization",
  authenticateToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      const result = await query(`
      SELECT h.hub_name,
             COUNT(DISTINCT v.vehicle_id) as total_vehicles,
             COUNT(DISTINCT CASE WHEN v.vehicle_status = 'available' THEN v.vehicle_id END) as available_vehicles,
             COUNT(DISTINCT b.booking_id) as total_bookings
      FROM mobility_hubs h
      LEFT JOIN vehicles v ON h.hub_id = v.current_hub_id
      LEFT JOIN bookings b ON h.hub_id = b.pickup_hub_id
      WHERE h.is_active = true
      GROUP BY h.hub_id, h.hub_name
      ORDER BY total_bookings DESC
    `);
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
