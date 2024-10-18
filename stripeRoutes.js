const express = require("express");
const pool = require("./db.js");
const router = express.Router();
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const getSellerStripeId = async (sellerId) => {
  try {
    const result = await pool.query("SELECT * FROM seller WHERE user_id = $1", [
      sellerId,
    ]);

    if (result.rows.length === 0) {
      throw new Error(`Seller with ID ${sellerId} not found`);
    }
    return result.rows[0].stripe_account_id;
  } catch (error) {
    console.error("Error fetching seller Stripe ID:", error);
    throw error;
  }
};

router.post("/create-payment-intent1", async (req, res) => {
  const { user_id, cartItems } = req.body;

  try {
    let totalAmount = 0;
    const transferData = [];

    // Calculate total amount and gather transfer information for sellers
    for (const item of cartItems) {
      const sellerStripeAccountId = await getSellerStripeId(item.seller_id); // Fetch seller's Stripe account ID

      // Calculate item total and add to totalAmount
      const itemTotal = Math.round(item.price * item.quantity * 100); // Amount in cents
      totalAmount += itemTotal;

      // Prepare transfer data for the seller
      transferData.push({
        amount: itemTotal, // Amount in cents
        currency: "usd",
        destination: sellerStripeAccountId, // Seller's connected Stripe account ID
      });
    }

    // Create a PaymentIntent for the total amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount, // Total amount in cents
      currency: "usd",
      payment_method_types: ["card"],
    });

    // Create transfers for each seller
    for (const transfer of transferData) {
      await stripe.transfers.create({
        ...transfer,
        payment_intent: paymentIntent.id, // Associate transfer with the payment intent
      });
    }

    // Send back the client secret to the frontend
    res.json({
      clientSecret: paymentIntent.client_secret,
      transferData: transferData,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
});

router.post("/create-checkout-session", async (req, res) => {
  const { amount } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Total Payment",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "https://10.10.0.103:8081/payment-success",
      cancel_url: "https://10.10.0.103:8081/payment-failure",
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).send("Failed to create checkout session");
  }
});

// Create a connected account for sellers
router.post("/create-connected-account", async (req, res) => {
  const { email } = req.body;

  try {
    // Create a connected account in test mode
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: email,
    });

    // Generate the account onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: "http://agro-sl.vercel.app/Sign_Up_Seller",
      return_url: "http://agro-sl.vercel.app/Success",
      type: "account_onboarding",
    });

    // Send back the test account link and account ID to the frontend
    res.json({ accountLink: accountLink.url, stripeAccountId: account.id });
  } catch (error) {
    console.error("Error creating connected account:", error);
    res.status(500).send("Error creating connected account");
  }
});

// Create a PaymentIntent (for processing payments)
router.post("/create-payment-intent", async (req, res) => {
  const { user_id, cartItems } = req.body; // Get user_id and cartItems from request

  try {
    let totalAmount = 0;
    const transferData = [];

    // Calculate total amount and gather transfer information for sellers
    for (const item of cartItems) {
      const sellerStripeAccountId = await getSellerStripeId(item.seller_id); // Fetch seller's Stripe account
      totalAmount += item.price * item.quantity;

      transferData.push({
        amount: Math.round(item.price * item.quantity * 100), // Amount in cents
        currency: "usd",
        destination: sellerStripeAccountId, // Seller's connected Stripe account ID
      });
    }

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Amount in cents
      currency: "usd",
      payment_method_types: ["card"],
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      transferData: transferData, // Pass this data to the frontend
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
});

router.post("/transfer-payment", async (req, res) => {
  const { paymentIntentId, transferData } = req.body;

  try {
    // After payment is successful, perform transfers to sellers
    for (const transfer of transferData) {
      await stripe.transfers.create({
        amount: transfer.amount,
        currency: "usd",
        destination: transfer.destination, // Seller's Stripe account ID
        transfer_group: paymentIntentId,
      });
    }

    res.status(200).send("Transfers created successfully.");
  } catch (error) {
    console.error("Error creating transfers:", error);
    res.status(500).json({ error: "Failed to create transfers" });
  }
});

router.post("/create-charge", async (req, res) => {
  const { amount } = req.body; // Amount in cents

  try {
    const charge = await stripe.charges.create({
      amount: amount,
      currency: "usd",
      source: "tok_visa", // Use a test card token
    });

    res.status(200).json({ success: true, charge });
  } catch (error) {
    console.error("Error creating charge:", error);
    res.status(500).json({ error: "Failed to create charge" });
  }
});

module.exports = router;
