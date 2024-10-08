const express = require("express");
const pool = require("./db.js");

const router = express.Router();

router.get("/buyer", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM buyer");

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

router.post("/buyer", async (req, res) => {
  const { user_id } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO buyer(user_id) VALUES($1) RETURNING *",
      [user_id]
    );
    console.log("Buyer stored successfully:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
module.exports = router;
