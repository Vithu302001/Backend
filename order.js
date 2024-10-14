const express = require("express");
const pool = require("./db.js");

const router = express.Router();

router.post("/orders", async (req, res) => {
  const { buyer_id, item_id, is_confirmed, seller_id, order_quantity } =
    req.body;
  try {
    const count = await pool.query('SELECT COUNT(*) FROM "order"');
    const rid = parseInt(count.rows[0].count) + 1;
    const order_id = `Ordt${String(rid).padStart(4, "0")}`;

    const result = await pool.query(
      'insert into "order" (order_id, buyer_id, item_id, order_date, is_confirmed, seller_id, order_quantity, sent_to_delivery) values ($1, $2, $3, $4, $5, $6, $7, $8) returning *',
      [
        order_id,
        buyer_id,
        item_id,
        new Date(),
        is_confirmed,
        seller_id,
        order_quantity,
        false,
      ]
    );

    console.log("Order stored successfully:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error storing order:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/api/orders/:orderId/send", async (req, res) => {
  const { orderId } = req.params;

  try {
    const result = await pool.query(
      'UPDATE "order" SET sent_to_delivery = $1 WHERE order_id = $2',
      [true, orderId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json({ message: "Order sent to delivery" });
  } catch (error) {
    console.error("Error sending order to delivery:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/api/processingorders/:orderId/send", async (req, res) => {
  const { orderId } = req.params;

  try {
    const result = await pool.query(
      'UPDATE "order" SET sent_to_delivery = $1 WHERE order_id = $2',
      [false, orderId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json({ message: "Order sent to delivery" });
  } catch (error) {
    console.error("Error sending order to delivery:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/api/orders", async (req, res) => {
  const { seller_id } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM "order" WHERE seller_id = $1 `,
      [seller_id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/api/processingorders", async (req, res) => {
  const { seller_id } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM "order" WHERE seller_id = $1`,
      [seller_id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/seller_orders/:sellerID", async (req, res) => {
  const sellerID = req.params.sellerID;
  const { startDate, endDate } = req.query; // Extracting startDate and endDate from query params

  try {
    let query = `
        SELECT o.*, i.item_name, i.unit_price 
        FROM "order" o
        JOIN item i ON o.item_id = i.item_id
        WHERE o.seller_id = $1
      `;

    const queryParams = [sellerID];

    if (startDate) {
      query += ` AND o.order_date >= $2`; // Add start date filter
      queryParams.push(startDate);
    }

    if (endDate) {
      query += ` AND o.order_date <= $3`; // Add end date filter
      queryParams.push(endDate);
    }

    const result = await pool.query(query, queryParams);

    if (result.rows.length > 0) {
      console.log(
        `Retrieved ${result.rows.length} orders for seller ID: ${sellerID}`
      );
      res.status(200).json(result.rows);
    } else {
      res.status(404).json({ message: "No orders found for this user" });
    }
  } catch (e) {
    console.error("Error retrieving orders:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/orders/:orderId", async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const result = await pool.query(
      'UPDATE "order" SET deliver_took = $1 WHERE order_id = $2',
      [true, orderId]
    );

    res.status(200).json({ message: "Order sent to delivery" });
  } catch (error) {
    console.error("Error taking the order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/orders/:orderId", async (req, res) => {
  const { orderId } = req.params; // Extract orderId from URL parameters

  try {
    const result = await pool.query(
      'DELETE FROM "order" WHERE order_id = $1 RETURNING *',
      [orderId]
    );

    if (result.rowCount === 0) {
      return res.status(404).send("Order not found");
    } else {
      return res.status(200).json({ message: "Order deleted successfully" });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).send("Server error");
  }
});

router.get("/orders", async (req, res) => {
  try {
    // Log the request to debug
    console.log("Fetching orders where sent_to_delivery is true");

    // Execute the query
    const deliveries = await pool.query(
      'SELECT order_id, buyer_id, item_id, order_date, is_confirmed, seller_id, order_quantity FROM "order" WHERE sent_to_delivery = $1 and deliver_took=$2 ',
      [true, false]
    );

    // Check if any rows were returned
    if (deliveries.rows.length === 0) {
      return res.status(404).json({ message: "No orders found for delivery" });
    }

    res.status(200).json(deliveries.rows);
  } catch (error) {
    // Log the error for debugging
    console.error("Error fetching orders:", error);

    // Send a detailed error response
    res
      .status(500)
      .json({ error: "Failed to fetch orders", details: error.message });
  }
});

router.get("/orders_for_riders", async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM "order" WHERE sent_to_delivery = true'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

router.get("/api/orders_for_buyers/:buyer_id", async (req, res) => {
  const { buyer_id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM "order" WHERE buyer_id=$1', [
      buyer_id,
    ]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

router.put("/api/orders_for_buyer/:order_id/cancel", async (req, res) => {
  const { orderId } = req.params;

  try {
    const result = await pool.query(
      'UPDATE "order" SET is_confirmed = $1 WHERE order_id = $2 ',
      [false, orderId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json({ message: "Order sent to delivery" });
  } catch (error) {
    console.error("Error sending order to delivery:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
