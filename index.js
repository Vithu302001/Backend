const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory (create this directory in your project root)
app.use(express.static(path.join(__dirname, "public")));

// Route for favicon
app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "favicon.ico")); // Adjust the path if necessary
});

// Routes
const users = require("./users.js");
const buyer = require("./buyer.js");
const seller = require("./seller.js");
const review = require("./review.js");
const order = require("./order.js");
const items = require("./items.js");
const delivery = require("./delivery.js");
const delivery_rider = require("./delivery_riders.js");
const complaints = require("./complaints.js");
const cart = require("./cart.js");
const admin = require("./admin.js");
const stripeRoutes = require("./stripeRoutes.js");
const twilio = require("./twilio.js");
const stats = require("./stats.js");

app.use("/users", users); // Consider more specific routes
app.use("/buyer", buyer);
app.use("/seller", seller);
app.use("/review", review);
app.use("/order", order);
app.use("/items", items);
app.use("/delivery", delivery);
app.use("/delivery_rider", delivery_rider);
app.use("/complaints", complaints);
app.use("/cart", cart);
app.use("/admin", admin);
app.use("/stripe", stripeRoutes);
app.use("/twilio", twilio);
app.use("/stats", stats);

// Start the server
app.listen(5001, () => {
  console.log("Server is running on port 5001");
});
