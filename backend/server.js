/**
 * OVRMS Main Server
 * Entry point for the application
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const path = require("path");

// Load configuration
const config = require("./config/config");

// Import middleware
const { notFound, errorHandler } = require("./middleware/errorHandler");

// Import routes
const authRoutes = require("./routes/auth");
const vehicleRoutes = require("./routes/vehicles");
const bookingRoutes = require("./routes/bookings");
const analyticsRoutes = require("./routes/analytics");
const hubRoutes = require("./routes/hubs"); // ← ADD THIS LINE

// Initialize Express app
const app = express();

// =====================================================
// MIDDLEWARE SETUP
// =====================================================

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Configure CSP based on your needs
  }),
);

// CORS
app.use(cors(config.cors));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// HTTP request logger
if (config.server.env === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// =====================================================
// API ROUTES
// =====================================================

app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/hubs", hubRoutes); // ← ADD THIS LINE


// Root route - for Render health checks
app.get("/", (req, res) => {
  res.json({ message: "OVRMS API is running", status: "ok" });
});
// Health check endpoint
app.get("/health", async (req, res) => {
  const { pool } = require("./config/database");
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
      environment: config.server.env,
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      database: "disconnected",
      error: error.message,
    });
  }
});

// API documentation endpoint
app.get("/api", (req, res) => {
  res.json({
    name: "OVRMS API",
    version: "1.0.0",
    description: "Online Vehicle Rental and Management System",
    endpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
      },
      vehicles: {
        list: "GET /api/vehicles",
        available: "GET /api/vehicles/available",
        details: "GET /api/vehicles/:id",
        create: "POST /api/vehicles (admin)",
        update: "PUT /api/vehicles/:id (admin)",
        delete: "DELETE /api/vehicles/:id (admin)",
      },
      bookings: {
        create: "POST /api/bookings",
        myBookings: "GET /api/bookings/my-bookings",
        list: "GET /api/bookings (admin)",
        approve: "POST /api/bookings/:id/approve (admin)",
        reject: "POST /api/bookings/:id/reject (admin)",
        cancel: "POST /api/bookings/:id/cancel",
      },
      analytics: {
        dashboard: "GET /api/analytics/dashboard (admin)",
        fleetStats: "GET /api/analytics/fleet-stats (admin)",
        revenue: "GET /api/analytics/revenue (admin)",
      },
    },
  });
});

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// =====================================================
// SERVER STARTUP
// =====================================================

const PORT = config.server.port;

const server = app.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log("🚀 OVRMS Server Started Successfully!");
  console.log("=".repeat(50));
  console.log(`📍 Environment: ${config.server.env}`);
  console.log(`🌐 Server running on port: ${PORT}`);
  console.log(`🔗 API URL: ${config.app.url}/api`);
  console.log(`🏥 Health check: ${config.app.url}/health`);
  console.log("=".repeat(50));
});

// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================

const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  server.close(() => {
    console.log("HTTP server closed.");

    const { pool } = require("./config/database");
    pool.end(() => {
      console.log("Database pool closed.");
      process.exit(0);
    });
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

module.exports = app;
