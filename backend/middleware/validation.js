/**
 * Request Validation Middleware
 */

const Joi = require('joi');

/**
 * Validate request body against schema
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }

    req.body = value;
    next();
  };
};

// Validation Schemas
const schemas = {
  // User Registration
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    fullName: Joi.string().min(2).max(100).required(),
    phoneNumber: Joi.string().pattern(/^\+?[0-9]{10,15}$/),
    organization: Joi.string().max(100),
    employeeId: Joi.string().max(50),
  }),

  // User Login
  login: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }),

  // Create Vehicle
  createVehicle: Joi.object({
    vehicleType: Joi.string().valid('car', 'bike').required(),
    vehicleName: Joi.string().min(2).max(100).required(),
    plateNumber: Joi.string().min(5).max(20).required(),
    currentHubId: Joi.string().uuid().required(),
    dailyRate: Joi.number().positive().required(),
    vehicleMake: Joi.string().max(50),
    vehicleModel: Joi.string().max(50),
    yearOfManufacture: Joi.number().integer().min(1990).max(new Date().getFullYear() + 1),
    color: Joi.string().max(30),
    seatingCapacity: Joi.number().integer().min(1).max(50),
    fuelType: Joi.string().valid('petrol', 'diesel', 'electric', 'hybrid'),
    notes: Joi.string().max(500),
  }),

  // Update Vehicle
  updateVehicle: Joi.object({
    vehicleType: Joi.string().valid('car', 'bike'),
    vehicleName: Joi.string().min(2).max(100),
    plateNumber: Joi.string().min(5).max(20),
    currentHubId: Joi.string().uuid(),
    vehicleStatus: Joi.string().valid('available', 'rented', 'maintenance', 'damaged', 'retired'),
    dailyRate: Joi.number().positive(),
    vehicleMake: Joi.string().max(50),
    vehicleModel: Joi.string().max(50),
    yearOfManufacture: Joi.number().integer().min(1990).max(new Date().getFullYear() + 1),
    color: Joi.string().max(30),
    seatingCapacity: Joi.number().integer().min(1).max(50),
    fuelType: Joi.string().valid('petrol', 'diesel', 'electric', 'hybrid'),
    notes: Joi.string().max(500),
  }).min(1),

  // Create Booking
  createBooking: Joi.object({
    vehicleId: Joi.string().uuid().required(),
    pickupHubId: Joi.string().uuid().required(),
    dropoffHubId: Joi.string().uuid().required(),
    requestedStartDate: Joi.date().iso().min('now').required(),
    requestedEndDate: Joi.date().iso().min(Joi.ref('requestedStartDate')).required(),
    purposeOfRental: Joi.string().max(500),
    specialRequirements: Joi.string().max(500),
  }),

  // Reject Booking
  rejectBooking: Joi.object({
    reason: Joi.string().min(10).max(500).required(),
  }),

  // Create Hub
  createHub: Joi.object({
    hubName: Joi.string().min(2).max(100).required(),
    locationDescription: Joi.string().max(500),
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180),
    capacity: Joi.number().integer().min(1).max(1000),
  }),
};

module.exports = {
  validate,
  schemas,
};
