/**
 * Error Handling Middleware
 */

const winston = require('winston');

// Setup logger
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/**
 * Custom error class
 */
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found handler
 */
const notFound = (req, res, next) => {
  const error = new AppError(
    `Route not found - ${req.originalUrl}`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // PostgreSQL errors
  if (err.code === '23505') {
    error = new AppError('Duplicate field value', 409, 'DUPLICATE_ENTRY');
  }
  if (err.code === '23503') {
    error = new AppError('Referenced record does not exist', 400, 'FOREIGN_KEY_VIOLATION');
  }
  if (err.code === '23502') {
    error = new AppError('Missing required field', 400, 'NULL_VIOLATION');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401, 'TOKEN_EXPIRED');
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(e => e.message).join(', ');
    error = new AppError(message, 400, 'VALIDATION_ERROR');
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    error: error.message || 'Internal server error',
    code: error.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

module.exports = {
  AppError,
  notFound,
  errorHandler,
};
