// const express = require("express");
// const pool = require("./db.js");
// const router = express.Router();
// require("dotenv").config({ path: "../.env" });
// const nodemailer = require("nodemailer");

// router.post("/send-confirmation", async (req, res) => {
//   const { user_email, cartItems } = req.body;

//   try {
//     // Set up transporter with your email provider (Gmail in this case)
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: "agrosl.marketplace@gmail.com", // Replace with your email
//         pass: "ygzy moso kwuh japx", // Replace with your email password or app password
//       },
//     });

//     // Create the email options
//     const mailOptions = {
//       from: "agrosl.marketplace@gmail.com",
//       to: user_email,
//       subject: "Order Confirmation",
//       html: `
//         <h3>Thank you for your purchase!</h3>
//         <p>Your order has been confirmed. Here are the details:</p>
//         <ul>
//           ${cartItems
//             .map((item) => `<li>${item.item_id} - ${item.quantity}</li>`)
//             .join("")}
//         </ul>
//       `,
//     };

//     // Send the email
//     await transporter.sendMail(mailOptions);
//     console.log("Email sent successfully");
//   } catch (error) {
//     console.error("Error sending email:", error);
//   }
// });

// module.exports = router;

const express = require("express");
const pool = require("./db.js"); // In case you need to query the database
const router = express.Router();
const cors = require("cors");
require("dotenv").config({ path: "../.env" });
const nodemailer = require("nodemailer");

// CORS configuration for this route
const corsOptions = {
  origin: "https://agro-sl.vercel.app", // Your frontend URL
  methods: ["POST", "OPTIONS"],
  credentials: true,
};

// Route to send the confirmation email
router.post("/send-confirmation", cors(corsOptions), async (req, res) => {
  const { user_email, cartItems } = req.body;

  try {
    // Set up transporter with your Gmail account
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "agrosl.marketplace@gmail.com", // Your email
        pass: "ygzy moso kwuh japx", // Your app-specific password
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

    res.status(200).json({ message: "Confirmation email sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Failed to send confirmation email." });
  }
});

// Handle preflight requests
router.options("/send-confirmation", cors(corsOptions));

module.exports = router;
