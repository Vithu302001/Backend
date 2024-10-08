const express = require("express");
const pool = require("./db.js");

const router = express.Router();

router.get("/items", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM item");

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

router.get("/items/:item_id", async (req, res) => {
  const itemID = req.params.item_id;
  try {
    const result = await pool.query("SELECT * FROM item WHERE item_id = $1", [
      itemID,
    ]);
    if (result.rows.length > 0) {
      console.log(
        `Retrieved ${result.rows.length} item for item ID: ${itemID}`
      );
      res.status(200).json(result.rows);
    } else {
      res.status(404).json({ message: "No item found for this id" });
    }
  } catch (e) {
    console.error("Error retrieving the item:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/items_update/:item_id", async (req, res) => {
  const item_id = req.params.item_id;
  const { quantity } = req.body;

  try {
    const result = await pool.query(
      "UPDATE item SET quantity = $1 WHERE item_id = $2 RETURNING *",
      [quantity, item_id]
    );

    if (result.rows.length > 0) {
      console.log(`Updated item ${item_id}  with quantity ${quantity}`);
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ message: "Item not found" });
    }
  } catch (e) {
    console.error("Error updating item quantity:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/items/:item_id", async (req, res) => {
  const item_id = req.params.item_id;

  try {
    const result = await pool.query(
      "DELETE FROM item WHERE item_id = $1 RETURNING *",
      [item_id]
    );

    if (result.rowCount > 0) {
      res.status(200).json({ message: "Item removed successfully." });
    } else {
      res.status(404).json({ message: "Item not found." });
    }
  } catch (err) {
    console.error("Error deleting item:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/items_seller/:sellerID", async (req, res) => {
  const sellerID = req.params.sellerID;
  console.log(sellerID);
  try {
    const result = await pool.query("SELECT * FROM item WHERE seller_id = $1", [
      sellerID,
    ]);
    if (result.rows.length > 0) {
      console.log(
        `Retrieved ${result.rows.length} items for user: ${sellerID}`
      );
      res.status(200).json(result.rows);
    } else {
      res.status(404).json({ message: "No items found for this user" });
    }
  } catch (e) {
    console.error("Error retrieving the items", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/api/items", async (req, res) => {
  const {
    item_name,
    unit_price,
    quantity,
    image_url,
    average_rating_value,
    description,
    seller_id,
    unit_type,
    category,
  } = req.body;

  try {
    // Validate input
    if (
      !item_name ||
      !unit_price ||
      !quantity ||
      !image_url ||
      !description ||
      !seller_id ||
      !unit_type
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Generate item_id in the format ITxxxx
    const result = await pool.query("SELECT COUNT(*) FROM item");
    const itemCount = parseInt(result.rows[0].count) + 1;
    const item_id = `i${String(itemCount).padStart(4, "0")}`;

    // Insert the new item into the database
    const insertResult = await pool.query(
      `INSERT INTO item (
          item_id, item_name, unit_price, quantity, image_url,average_rating_value, description, seller_id, unit_type,category
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,$10) RETURNING *`,
      [
        item_id,
        item_name,
        unit_price,
        quantity,
        image_url,
        average_rating_value,
        description,
        seller_id,
        unit_type,
        category,
      ]
    );

    res.status(201).json(insertResult.rows[0]);
  } catch (error) {
    console.error("Error inserting item:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
