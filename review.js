const express = require("express");
const pool = require("./db.js");

const router = express.Router();

router.post("/reviews", async (req, res) => {
  const { item_id, description, rating, buyer_id } = req.body;

  if (!item_id || !description || !rating || !buyer_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const countResult = await pool.query("SELECT COUNT(*) FROM review");
    const rid = parseInt(countResult.rows[0].count) + 1;
    const review_id = `rw${String(rid).padStart(4, "0")}`;

    const result = await pool.query(
      `INSERT INTO review (review_id, item_id, description, rating, buyer_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [review_id, item_id, description, rating, buyer_id]
    );

    res.status(201).json({
      message: "Review successfully created",
      review: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reviews/:itemID", async (req, res) => {
  const itemID = req.params.itemID;
  console.log("Item ID:", itemID);

  try {
    const result = await pool.query(
      `SELECT
          u.first_name,
          u.last_name,
          r.review_id,
          r.description,
          r.rating
        FROM
          review r
        JOIN
          "users" u
        ON
          r.buyer_id = u.user_id
        WHERE
          r.item_id = $1`,
      [itemID]
    );

    console.log("Query result:", result.rows);

    if (result.rows.length === 0) {
      return res.status(404).send("No reviews found");
    } else {
      return res.status(200).json(result.rows);
    }
  } catch (e) {
    console.error(e);

    console.error("Error fetching reviews:", e);

    return res.status(500).send("Server error");
  }
});

module.exports = router;
