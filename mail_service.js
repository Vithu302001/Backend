const express = require("express");
const pool = require("./db.js");
const router = express.Router();
const cors = require("cors");
require("dotenv").config({ path: "../.env" });
const nodemailer = require("nodemailer");

// CORS configuration for this route
const corsOptions = {
  origin: "https://agro-sl.vercel.app",
  methods: ["POST", "OPTIONS"],
  credentials: true,
};

// Route to send the confirmation email
router.post("/send-confirmation", cors(corsOptions), async (req, res) => {
  const { user_email, cartItems } = req.body;

  const itemsWithNames = await Promise.all(
    cartItems.map(async (item) => {
      try {
        const result = await pool.query(
          "SELECT item_name FROM item WHERE item_id = $1",
          [item.item_id]
        );
        return {
          ...item,
          item_name: result.rows[0]?.item_name || "Unknown Item",
        };
      } catch (error) {
        console.error(
          `Error fetching item_name for item_id ${item.item_id}:`,
          error
        );
        return { ...item, item_name: "Unknown Item" };
      }
    })
  );

  try {
    // Set up transporter with your Gmail account
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "agrosl.marketplace@gmail.com", // Your email
        pass: "ygzymosokwuhjapx", // Your app-specific password
      },
    });

    // Create the email options
    const mailOptions = {
      from: "agrosl.marketplace@gmail.com",
      to: user_email,
      subject: "Order Confirmation",
      html: `
        <h3>Thank you for your purchase!</h3>
        <p>You have successfully placed the order. Here are the details:</p>
        <ul>
          ${itemsWithNames
            .map(
              (item) =>
                `<li>${item.item_name} (ID: ${item.item_id}) - Quantity: ${item.quantity}</li>`
            )
            .join("")}
        </ul>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");

    res.status(200).json({ message: "Confirmation email sent successfully!" });
  } catch (error) {
    console.error("Error during email:", error); // Log the full error
    res
      .status(500)
      .json({ message: "Error sending email", error: error.message });
  }
});

// Handle preflight requests
router.options("/send-confirmation", cors(corsOptions));

module.exports = router;
