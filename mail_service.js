const express = require("express");
const pool = require("./db.js");
const router = express.Router();
require("dotenv").config({ path: "../.env" });
const nodemailer = require("nodemailer");

router.post("/send-confirmation", async (req, res) => {
  const { user_email, cartItems } = req.body;

  try {
    // Set up transporter with your email provider (Gmail in this case)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "agrosl.marketplace@gmail.com", // Replace with your email
        pass: "ygzy moso kwuh japx", // Replace with your email password or app password
      },
    });

    // Create the email options
    const mailOptions = {
      from: "agrosl.marketplace@gmail.com",
      to: user_email,
      subject: "Order Confirmation",
      html: `
        <h3>Thank you for your purchase!</h3>
        <p>Your order has been confirmed. Here are the details:</p>
        <ul>
          ${cartItems
            .map((item) => `<li>${item.item_id} - ${item.quantity}</li>`)
            .join("")}
        </ul>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
});

module.exports = router;
