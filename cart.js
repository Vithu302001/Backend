const express = require("express");
const pool = require("./db.js");

const router = express.Router();

router.get("/cart", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM shopping_cart");
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

router.get("/cart/:userID", async (req, res) => {
  const userID = req.params.userID;

  try {
    const result = await pool.query(
      "SELECT * FROM shopping_cart WHERE buyer_id = $1",
      [userID]
    );
    if (result.rows.length > 0) {
      console.log(
        `Retrieved ${result.rows.length} items for user ID: ${userID}`
      );
      res.status(200).json(result.rows);
    } else {
      res.status(404).json({ message: "No items found for this user" });
    }
  } catch (e) {
    console.error("Error retrieving items:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/cartWithSellerName/:userID", async (req, res) => {
  const userID = req.params.userID;
  try {
    const result = await pool.query(
      `SELECT c.*, i.item_name, i.unit_price, s.last_name AS seller_name 
       FROM shopping_cart c 
       JOIN item i ON c.item_id = i.item_id
       JOIN users s ON i.seller_id = s.user_id 
       WHERE c.buyer_id = $1`,
      [userID]
    );
    if (result.rows.length > 0) {
      res.status(200).json(result.rows);
    } else {
      res.status(404).json({ message: "No cart items found" });
    }
  } catch (e) {
    console.error("Error retrieving cart items:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/cart/:buyer_id/:item_id", async (req, res) => {
  const { buyer_id, item_id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM shopping_cart WHERE buyer_id = $1 AND item_id = $2 RETURNING *",
      [buyer_id, item_id]
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

router.post("/cart", async (req, res) => {
  const { buyer_id, item_id, quantity, price } = req.body;

  try {
    const sellerResult = await pool.query(
      "SELECT seller_id FROM item WHERE item_id = $1",
      [item_id]
    );

    if (sellerResult.rows.length === 0) {
      return res.status(404).json({ error: "Seller not found" });
    }

    const seller_id = sellerResult.rows[0].seller_id;

    const result = await pool.query(
      "INSERT INTO shopping_cart(buyer_id, item_id, quantity, seller_id, price) VALUES($1, $2, $3, $4, $5) RETURNING *",
      [buyer_id, item_id, quantity, seller_id, price]
    );

    console.log("Item stored successfully:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      // Unique violation error code
      res.status(409).json({ error: "This item is already in your cart." });
    } else {
      console.error("Error adding item to cart:", err);
      res
        .status(500)
        .json({ error: "An error occurred while adding to the cart." });
    }
  }
});

router.put("/cart/:buyer_id/:item_id", async (req, res) => {
  const { buyer_id, item_id } = req.params;
  const { quantity } = req.body;

  try {
    const result = await pool.query(
      "UPDATE shopping_cart SET quantity = $1 WHERE buyer_id = $2 AND item_id = $3 RETURNING *",
      [quantity, buyer_id, item_id]
    );

    if (result.rows.length > 0) {
      console.log(
        `Updated item ${item_id} for user ${buyer_id} with quantity ${quantity}`
      );
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ message: "Item not found" });
    }
  } catch (e) {
    console.error("Error updating item quantity:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
