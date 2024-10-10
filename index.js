const express = require("express");
const app = express();
const cors = require("cors");
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

//middleware
app.use(cors());
app.use(express.json());

//ROUTES//

app.use("/", users);
app.use("/", buyer);
app.use("/", seller);
app.use("/", review);
app.use("/", order);
app.use("/", items);
app.use("/", delivery);
app.use("/", delivery_rider);
app.use("/", complaints);
app.use("/", cart);
app.use("/", admin);
app.use("/", stripeRoutes);
app.use("/", twilio);
app.use("/", stats);

app.listen(5001, () => {
  console.log("Server is running on port 5001");
});
