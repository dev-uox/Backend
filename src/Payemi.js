import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";

dotenv.config();

const router = express.Router();
const app = express();

// Enable CORS
app.use(cors({
  origin: "*", // Replace with specific origin if needed for security, e.g., "http://your-frontend-domain.com"
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Function to send emails
const sendEmails = async (userDetails, paymentMethod, amount, planId) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // Replace with your email service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const userMailOptions = {
    from: process.env.EMAIL_USER,
    to: userDetails.email,
    subject: "Payment Confirmation",
    text: `Dear ${userDetails.name},

Your payment of ₹${amount * 100} for plan ID: ${planId} using ${paymentMethod} has been successful.

Thank you for your purchase!

Best regards,
EMI Payment Team`,
  };

  const adminMailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: "New Payment Received",
    text: `A new payment has been received:

Payment Method: ${paymentMethod}
Amount: ₹${amount * 100}
Plan ID: ${planId}
User Details: ${JSON.stringify(userDetails, null, 2)}

Best regards,
Payment System`,
  };

  // Send emails
  await transporter.sendMail(userMailOptions);
  await transporter.sendMail(adminMailOptions);
};

// Route to create Razorpay order
router.post("/razorpay/order", async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: amount * 100, // Amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({ orderId: order.id });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ error: "Failed to create Razorpay order." });
  }
});

// Route to handle Razorpay payment success
router.post("/razorpay/success", async (req, res) => {
  try {
    const { paymentId, orderId, signature, userDetails, planId, amount } = req.body;

    // Verify Razorpay payment signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (generatedSignature !== signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Send emails after successful payment
    await sendEmails(userDetails, "Razorpay", amount, planId);

    res.status(200).json({ message: "Payment verified and emails sent." });
  } catch (error) {
    console.error("Error in Razorpay success:", error);
    res.status(500).json({ error: "An error occurred during payment processing." });
  }
});

// Route to handle PayPal order creation
router.post("/paypal/order", async (req, res) => {
    try {
      const { amount } = req.body;
      if (!amount) {
        return res.status(400).json({ error: "Amount is required." });
      }
  
      const conversionResponse = await axios.get("https://api.exchangerate-api.com/v4/latest/INR");
      const conversionRate = conversionResponse.data.rates.USD;
  
      if (!conversionRate) {
        throw new Error("Failed to fetch conversion rate.");
      }
  
      const amountInUSD = (amount / 100) * conversionRate;
      res.status(200).json({ amountInUSD: amountInUSD.toFixed(2) });
    } catch (error) {
      console.error("Error creating PayPal order:", error.message);
      res.status(500).json({ error: "Failed to create PayPal order." });
    }
  });
  
// Route to handle PayPal payment success
router.post("/paypal/success", async (req, res) => {
    try {
      const { paymentId, userDetails, planId, amount } = req.body;
  
      if (!paymentId || !userDetails || !planId || !amount) {
        return res.status(400).json({ error: "Invalid request data." });
      }
  
      // Optionally verify paymentId with PayPal API (not mandatory for sandbox)
      console.log(`Payment verified: ${paymentId}`);
  
      // Email functionality
      await sendEmails(userDetails, "PayPal", amount, planId);
  
      res.status(200).json({ message: "Payment verified and emails sent." });
    } catch (error) {
      console.error("Error in PayPal success:", error.message);
      res.status(500).json({ error: "An error occurred during payment processing." });
    }
  });
  

export default router;
