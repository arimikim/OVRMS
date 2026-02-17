/**
 * Utility Helper Functions
 */

const { query } = require('../config/database');

/**
 * Log audit trail
 */
const logAudit = async (userId, actionType, entityType, entityId, description, ipAddress) => {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, actionType, entityType, entityId, description, ipAddress]
    );
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
};

/**
 * Calculate rental cost
 */
const calculateRentalCost = async (vehicleId, startDate, endDate) => {
  try {
    const result = await query(
      'SELECT calculate_rental_cost($1, $2, $3) as cost',
      [vehicleId, startDate, endDate]
    );
    return parseFloat(result.rows[0].cost);
  } catch (error) {
    throw new Error('Failed to calculate rental cost');
  }
};

/**
 * Calculate overdue charges
 */
const calculateOverdueCharges = async (bookingId) => {
  try {
    const result = await query(
      'SELECT calculate_overdue_charges($1) as charges',
      [bookingId]
    );
    return parseFloat(result.rows[0].charges);
  } catch (error) {
    throw new Error('Failed to calculate overdue charges');
  }
};

/**
 * Check vehicle availability for date range
 */
const checkVehicleAvailability = async (vehicleId, startDate, endDate) => {
  const result = await query(
    `SELECT COUNT(*) FROM bookings
     WHERE vehicle_id = $1
     AND booking_status IN ('approved', 'active')
     AND (
       (requested_start_date <= $2 AND requested_end_date >= $2)
       OR (requested_start_date <= $3 AND requested_end_date >= $3)
       OR (requested_start_date >= $2 AND requested_end_date <= $3)
     )`,
    [vehicleId, startDate, endDate]
  );
  
  return parseInt(result.rows[0].count) === 0;
};

/**
 * Format date to YYYY-MM-DD
 */
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Generate random string
 */
const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Sanitize string for SQL
 */
const sanitizeString = (str) => {
  if (!str) return str;
  return str.replace(/[<>]/g, '');
};

/**
 * Parse pagination parameters
 */
const parsePagination = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
};

/**
 * Build pagination response
 */
const buildPaginationResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

/**
 * Send email notification (placeholder)
 */
const sendEmail = async (to, subject, body) => {
  // TODO: Implement email sending with nodemailer
  console.log(`Email to ${to}: ${subject}`);
  return true;
};

/**
 * Send SMS notification (placeholder)
 */
const sendSMS = async (phoneNumber, message) => {
  // TODO: Implement SMS sending with Africa's Talking or similar
  console.log(`SMS to ${phoneNumber}: ${message}`);
  return true;
};

module.exports = {
  logAudit,
  calculateRentalCost,
  calculateOverdueCharges,
  checkVehicleAvailability,
  formatDate,
  generateRandomString,
  sanitizeString,
  parsePagination,
  buildPaginationResponse,
  sendEmail,
  sendSMS,
};
