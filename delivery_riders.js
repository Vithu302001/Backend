const express = require("express");
const pool = require("./db.js");

const router = express.Router();

router.post("/delivery_riders", async (req, res) => {
  const { user_id, NIC } = req.body;

  try {
    // Validate input
    if (!user_id || !NIC) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO "delivery_rider" (
            "user_id", "NIC"
          ) VALUES ($1, $2) RETURNING *`,
      [user_id, NIC]
    );
    console.log("details stored successfully");
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error inserting delivery rider:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
