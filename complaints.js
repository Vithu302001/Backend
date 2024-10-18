const express = require("express");
const pool = require("./db.js");

const router = express.Router();

router.get("/complaints", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM complaint");
    if (result.rows.length === 0) {
      return res.status(404).send("No complaints found");
    } else {
      return res.status(200).json(result.rows);
    }
  } catch (e) {
    console.error(e);
    return res.status(500).send("Server error");
  }
});

router.get("/complaints/:buyer_id", async (req, res) => {
  const buyer_id = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM complaint WHERE buyer_id = $1",
      [buyer_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).send("No complaints found");
    } else {
      return res.status(200).json(result.rows);
    }
  } catch (e) {
    console.error(e);
    return res.status(500).send("Server error");
  }
});

router.get("/complaints/:/seller_id", async (req, res) => {
  const seller_id = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM complaint WHERE seller_id = $1",
      [seller_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).send("No complaints found");
    } else {
      return res.status(200).json(result.rows);
    }
  } catch (e) {
    console.error(e);
    return res.status(500).send("Server error");
  }
});

router.get("/get_seller_complaints/:sellerID", async (req, res) => {
  const sellerID = req.params.sellerID;
  console.log(sellerID);
  try {
    const result = await pool.query(
      "SELECT * FROM complaint WHERE seller_id = $1",
      [sellerID]
    );
    console.log("result", { result });
    if (result.rows.length === 0) {
      return res.status(404).send("No complaints found");
    } else {
      return res.status(200).json(result.rows);
    }
  } catch (e) {
    console.error(e);
    return res.status(500).send("Server error");
  }
});

router.get("/api/complaints", async (req, res) => {
  const { seller_id } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM complaint_users WHERE seller_id = $1`,
      [seller_id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/all_complaints_for_admins", async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM complaint_users`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/api/complaints/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await pool.query(
      `UPDATE complaint
         SET complaint_status_seller = $1
         WHERE complaint_id = $2`,
      [status, id]
    );
    res.status(200).json({ message: "Complaint status updated successfully" });
  } catch (error) {
    console.error("Error updating complaint status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/api/complaints", async (req, res) => {
  const { buyer_id, description, seller_id, order_id, complaint_seller } =
    req.body;

  try {
    // Generate a new complaint_id
    const result = await pool.query("SELECT COUNT(*) FROM complaint");
    const complaintCount = parseInt(result.rows[0].count) + 1;
    const complaint_id = `C${complaintCount.toString().padStart(4, "0")}`;

    // Insert the complaint into the database
    const query =
      "INSERT INTO complaint (complaint_id, buyer_id, description, seller_id, order_id, complained_seller, complaint_status_seller) VALUES ($1, $2, $3, $4, $5, $6, $7)";
    const values = [
      complaint_id,
      buyer_id,
      description,
      seller_id,
      order_id,
      complaint_seller,
      "reviewing",
    ];

    await pool.query(query, values);

    res.status(200).json({ message: "Complaint submitted successfully" });
  } catch (error) {
    console.error("Error inserting complaint:", error);
    res.status(500).json({ message: "Error submitting complaint" });
  }
});

module.exports = router;
