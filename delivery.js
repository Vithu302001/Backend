const express = require("express");
const pool = require("./db.js");

const router = express.Router();

router.get("/deliveries/:riderId", async (req, res) => {
  const { riderId } = req.params; // Extract riderId from URL params

  try {
    const result = await pool.query(
      "SELECT * FROM delivery_with_order_details WHERE delivery_rider_id = $1 and is_delivered_to_buyer=$2",
      [riderId, false]
    );

    if (result.rows.length === 0) {
      return res.status(200).json([]);
    } else {
      return res.status(200).json(result.rows);
    }
  } catch (e) {
    console.error(e);
    return res.status(500).send("Server error");
  }
});

router.get("/deliveries-orderID/:orderId", async (req, res) => {
  const { orderId } = req.params; // Extract riderId from URL params

  try {
    const result = await pool.query(
      "SELECT * FROM delivery_with_order_details WHERE order_id = $1 and is_delivered_to_buyer=$2",
      [orderId, false]
    );

    if (result.rows.length === 0) {
      return res.status(200).json([]);
    } else {
      return res.status(200).json(result.rows);
    }
  } catch (e) {
    console.error(e);
    return res.status(500).send("Server error");
  }
});

router.get("/deliveries-buyerId/:buyerId", async (req, res) => {
  const { buyerId } = req.params; 

  try {
    const result = await pool.query(
      "SELECT * FROM delivery_with_order_details WHERE buyer_id = $1",
      [buyerId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json([]);
    } else {
      return res.status(200).json(result.rows);
    }
  } catch (e) {
    console.error(e);
    return res.status(500).send("Server error");
  }
});

router.post("/deliveries", async (req, res) => {
  const { deliveryData } = req.body;
  const { order_id, delivery_rider_id, is_delivered_to_buyer } = deliveryData;
  if (!order_id || !delivery_rider_id) {
    return res.status(400).json({
      error: "Missing required fields: order_id and delivery_rider_id",
    });
  }

  try {
    // Fetch the last inserted delivery_id
    const lastIdResult = await pool.query(
      `SELECT delivery_id FROM delivery ORDER BY delivery_id DESC LIMIT 1`
    );

    let newDeliveryId;
    if (lastIdResult.rows.length > 0) {
      const lastDeliveryId = lastIdResult.rows[0].delivery_id;
      const numericPart = parseInt(lastDeliveryId.substring(1)) + 1;
      newDeliveryId = `D${numericPart.toString().padStart(4, "0")}`;
    } else {
      newDeliveryId = "D0001"; // First delivery entry
    }

    // Ensure the new ID is unique
    const existingIdCheck = await pool.query(
      `SELECT delivery_id FROM delivery WHERE delivery_id = $1`,
      [newDeliveryId]
    );

    if (existingIdCheck.rows.length > 0) {
      return res.status(400).json({ error: "Delivery ID already exists" });
    }

    // Insert the new delivery record
    await pool.query(
      `INSERT INTO delivery (delivery_id, order_id, delivery_rider_id, is_delivered_to_buyer) 
       VALUES ($1, $2, $3, $4)`,
      [newDeliveryId, order_id, delivery_rider_id, is_delivered_to_buyer]
    );

    res.status(201).json({
      message: "Delivery record added successfully",
      deliveryId: newDeliveryId,
    });
  } catch (err) {
    console.error("Error adding delivery record:", err.message);
    res
      .status(500)
      .json({ error: "Failed to add delivery record", details: err.message });
  }
});

router.put("/delivery-status/:deliveryId", async (req, res) => {
  const { deliveryId } = req.params;
  const { delivery_status } = req.body;

  try {
    await pool.query(
      `
      UPDATE delivery
      SET delivery_status = $1::delivery_status_enum, 
      is_delivered_to_buyer = CASE WHEN $1 = 'Delivered' THEN true ELSE false END
      WHERE delivery_id = $2
    `,
      [delivery_status, deliveryId]
    );

    res.json({ message: "Delivery status updated successfully" });
  } catch (error) {
    console.error("Error updating delivery status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/delivery-by-orderID/:orderID", async (req, res) => {
  const { orderID } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM delivery WHERE order_id = $1",
      [orderID]
    );
    res.status(200).json(result.rows);
  } catch (e) {
    console.error(e);
    return res.status(500).send("Server error");
  }
});

router.patch("/delivery/:deliveryId", async (req, res) => {
  const { deliveryId } = req.params;
  const { is_delivered_to_buyer, confirmation_date } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE delivery 
      SET is_delivered_to_buyer = $1, 
          delivered_to_dc = $2
      WHERE delivery_id = $3
      `,
      [is_delivered_to_buyer, confirmation_date, deliveryId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    res.status(200).json({ message: "Delivery updated successfully" });
  } catch (err) {
    console.error("Error updating delivery:", err);
    res.status(500).json({ message: "Internal server error", error: err });
  }
});

module.exports = router;
