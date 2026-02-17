/**
 * Mobility Hubs Routes
 */

const express = require("express");
const router = express.Router();

const { query } = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

/**
 * @route   GET /api/hubs
 * @desc    Get all mobility hubs
 * @access  Private
 */
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const result = await query(
      "SELECT * FROM mobility_hubs WHERE is_active = true ORDER BY hub_name",
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/hubs/:id
 * @desc    Get single hub
 * @access  Private
 */
router.get("/:id", authenticateToken, async (req, res, next) => {
  try {
    const result = await query(
      "SELECT * FROM mobility_hubs WHERE hub_id = $1",
      [req.params.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Hub not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
