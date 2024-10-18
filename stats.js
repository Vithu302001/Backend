const express = require("express");
const pool = require("./db.js");

const router = express.Router();

router.get("/user_counts", async (req, res) => {
  try {
    const result = await pool.query(`
        SELECT user_type, COUNT(*) AS count 
        FROM users 
        WHERE user_type IN ('seller', 'buyer', 'delivery_rider') 
        GROUP BY user_type
      `);

    const adminCountResult = await pool.query(`
        SELECT COUNT(*) AS count FROM admin
      `);

    // Initialize count variables
    let sellerCount = 0;
    let buyerCount = 0;
    let deliveryRiderCount = 0;
    let adminCount = adminCountResult.rows[0].count;

    // Loop through the result and set the counts based on user_type
    result.rows.forEach((row) => {
      if (row.user_type === "seller") {
        sellerCount = row.count;
      } else if (row.user_type === "buyer") {
        buyerCount = row.count;
      } else if (row.user_type === "delivery_rider") {
        deliveryRiderCount = row.count;
      }
    });

    // Return the counts as a JSON object
    return res.status(200).json({
      sellerCount,
      buyerCount,
      deliveryRiderCount,
      adminCount,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).send("Server error");
  }
});

router.get("/item_counts", async (req, res) => {
  try {
    // Query to get the counts of items based on the category
    const result = await pool.query(`
        SELECT category, COUNT(*) AS count 
        FROM item 
        WHERE category IN ('Fruits', 'Vegetables', 'Animal Products', 'Seeds') 
        GROUP BY category
      `);

    // Initialize count variables
    let fruitCount = 0;
    let vegetableCount = 0;
    let animalProductCount = 0;
    let seedCount = 0;

    // Loop through the result and set the counts based on category
    result.rows.forEach((row) => {
      if (row.category === "Fruits") {
        fruitCount = row.count;
      } else if (row.category === "Vegetables") {
        vegetableCount = row.count;
      } else if (row.category === "Animal Products") {
        animalProductCount = row.count;
      } else if (row.category === "Seeds") {
        seedCount = row.count;
      }
    });

    // Return the counts as a JSON object
    return res.status(200).json({
      fruitCount,
      vegetableCount,
      animalProductCount,
      seedCount,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).send("Server error");
  }
});

router.get("/sales_stats", async (req, res) => {
  try {
    // Query to get the count of orders from the order table
    const orderCountResult = await pool.query(`
        SELECT COUNT(*) AS count FROM "order"
      `);
    const orderCount = orderCountResult.rows[0].count;

    // Query to get the count of complaints from the complaint table
    const complaintCountResult = await pool.query(`
        SELECT COUNT(*) AS count FROM complaint
      `);
    const complaintCount = complaintCountResult.rows[0].count;

    // Query to get the most sold item_id from the order table (ignore nulls)
    const mostSoldItemResult = await pool.query(`
        SELECT item_id, COUNT(*) AS count 
        FROM "order"
        WHERE item_id IS NOT NULL
        GROUP BY item_id
        ORDER BY count DESC
        LIMIT 1
      `);

    let mostSoldItem = null;
    let mostSoldCategory = null;

    if (mostSoldItemResult.rows.length > 0) {
      const mostSoldItemId = mostSoldItemResult.rows[0].item_id;

      // Query to get the item name and category for the most sold item
      const itemDetailsResult = await pool.query(
        `
          SELECT item_name, category FROM item WHERE item_id = $1
        `,
        [mostSoldItemId]
      );

      if (itemDetailsResult.rows.length > 0) {
        mostSoldItem = itemDetailsResult.rows[0].item_name;
        mostSoldCategory = itemDetailsResult.rows[0].category;
      }
    }
    if (!mostSoldItem || !mostSoldCategory) {
      console.log("No data found for most sold item or category.");
    }

    // Return the stats as a JSON object
    return res.status(200).json({
      orderCount,
      complaintCount,
      mostSoldItem: mostSoldItem || "No data",
      mostSoldCategory: mostSoldCategory || "No data",
    });
  } catch (e) {
    console.error("Error occurred:", e);
    return res.status(500).send("Server error");
  }
});

module.exports = router;
