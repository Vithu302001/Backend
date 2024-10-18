const express = require("express");
const pool = require("./db.js");

const router = express.Router();

router.post("/admins", async (req, res) => {
  const { user_id, email } = req.body;

  try {
    // Insert new admin into the database
    const result = await pool.query(
      `INSERT INTO admin (
            user_id,email
          ) VALUES ($1, $2) RETURNING *`,
      [user_id, email]
    );
    console.log("Account stored successfully:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error inserting user:", error.message);

    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/admin/:adminID", async (req, res) => {
  const adminID = req.params.adminID;
  console.log(adminID);
  try {
    const result = await pool.query("SELECT * FROM admin WHERE user_id = $1", [
      adminID,
    ]);
    console.log("result", { result });
    if (result.rows.length === 0) {
      return res.status(404).send("Not an admin");
    } else {
      return res.status(200).json(result.rows[0]);
    }
  } catch (e) {
    console.error(e);
    return res.status(500).send("Server error");
  }
});

module.exports = router;
