const express = require("express");
const pool = require("./db.js");

const router = express.Router();

router.get("/sellers", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM seller");
    if (result.rows.length === 0) {
      return res.status(404).send("No items found");
    } else {
      return res.status(200).json(result.rows);
    }
  } catch (e) {
    console.error(e);
    return res.status(500).send("Server error");
  }
});

router.get("/getseller/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM seller WHERE user_id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).send("No seller found");
    } else {
      return res.status(200).json(result.rows[0]);
    }
  } catch (e) {
    console.error(e);
    return res.status(500).send("Server error");
  }
});

router.post("/sellers", async (req, res) => {
  const { user_id, NIC, store_name, stripe_account_id } = req.body;

  try {
    // Validate input
    if (!user_id || !NIC || !store_name || !stripe_account_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Insert new seller into the database
    const result = await pool.query(
      `INSERT INTO "seller" (
            "user_id", "NIC", "store_name", "stripe_account_id"
          ) VALUES ($1, $2, $3, $4) RETURNING *`,
      [user_id, NIC, store_name, stripe_account_id]
    );
    console.log("details stored successfully");
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error inserting seller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/seller/stats/:seller_id", async (req, res) => {
  const { seller_id } = req.params;

  try {
    // Get connection from the pool
    const client = await pool.connect();

    // SQL Queries to fetch counts from orders, deliveries, and items tables
    const orderCountQuery = 'SELECT COUNT(*) FROM "order" WHERE seller_id = $1';

    const itemCountQuery = "SELECT COUNT(*) FROM item WHERE seller_id = $1";

    // Execute the queries
    const orderCountResult = await client.query(orderCountQuery, [seller_id]);

    const itemCountResult = await client.query(itemCountQuery, [seller_id]);

    // Parse the results
    const orderCount = parseInt(orderCountResult.rows[0].count, 10);

    const itemCount = parseInt(itemCountResult.rows[0].count, 10);

    // Send the result as JSON
    res.json({
      orders: orderCount,

      items: itemCount,
    });

    // Release the client connection
    client.release();
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).send("Error fetching stats");
  }
});

module.exports = router;
