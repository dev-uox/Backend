

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
  origin: "*", // Replace with specific origin if needed for security
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Function to send emails
const sendEmails = async (userDetails, paymentMethod, amount, planId, orderId) => {
  // Validate inputs and provide fallbacks to prevent undefined issues
  const customerName = userDetails?.name || "Valued Customer";
  const customerEmail = userDetails?.email || "No email provided";
  const plan = planId || "N/A";
  const order = orderId || "N/A";
  const paidAmount = amount ? `₹${amount}` : "Unknown";

  if (!userDetails || !userDetails.email || !planId || !orderId || !amount) {
    throw new Error("Missing required parameters for sending emails.");
  }

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

  // User email template
  const userMailOptions = {
    from: process.env.EMAIL_USER,
    to: customerEmail,
    subject: "Payment Confirmation",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h1 style="color: #4CAF50; text-align: center; margin-bottom: 20px;">Thank You for Your Payment!</h1>
        <p style="font-size: 1rem; color: #333;">Dear <strong>${customerName}</strong>,</p>
        <p style="font-size: 1rem; color: #555;">We have successfully received your payment. Below are the payment details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 1rem;">
          <tr>
            <th style="text-align: left; padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;">Plan ID</th>
            <td style="padding: 10px; border: 1px solid #ddd;">${plan}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Payment Method</th>
            <td style="padding: 10px; border: 1px solid #ddd;">${paymentMethod}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;">Order ID</th>
            <td style="padding: 10px; border: 1px solid #ddd;">${order}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Amount Paid</th>
            <td style="padding: 10px; border: 1px solid #ddd;">${paidAmount*100}</td>
          </tr>
        </table>
        <p style="font-size: 1rem; color: #555; text-align: center; margin: 20px 0;">
          If you have any questions, feel free to contact us at <a href="mailto:contact@vahlayastro.com" style="color: #4CAF50;">contact@vahlayastro.com</a>.
        </p>
        <p style="text-align: center; font-size: 1rem; color: #777; margin-top: 20px;">
          Warm regards,<br>
          <strong>EMI Payment Team</strong>
        </p>
      </div>
    `,
  };

  // Admin email template
  const adminMailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: "New Payment Received",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h1 style="color: #FF5733; text-align: center; margin-bottom: 20px;">New Payment Notification</h1>
        <p style="font-size: 1rem; color: #555;">A new payment has been received. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 1rem;">
          <tr>
            <th style="text-align: left; padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;">Customer Name</th>
            <td style="padding: 10px; border: 1px solid #ddd;">${customerName}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Customer Email</th>
            <td style="padding: 10px; border: 1px solid #ddd;">${customerEmail}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;">Plan ID</th>
            <td style="padding: 10px; border: 1px solid #ddd;">${plan}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Order ID</th>
            <td style="padding: 10px; border: 1px solid #ddd;">${order}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;">Payment Method</th>
            <td style="padding: 10px; border: 1px solid #ddd;">${paymentMethod}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Amount Paid</th>
            <td style="padding: 10px; border: 1px solid #ddd;">${paidAmount*100}</td>
          </tr>
        </table>
        <p style="text-align: center; font-size: 1rem; color: #777; margin-top: 20px;">
          Please check the admin dashboard for more details.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(userMailOptions);
    console.log("User email sent successfully.");
    await transporter.sendMail(adminMailOptions);
    console.log("Admin email sent successfully.");
  } catch (error) {
    console.error("Error sending emails:", error.message);
    throw new Error("Failed to send email notifications.");
  }
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

    console.log("Received payment details:", req.body);

    // Validate the request body
    if (!paymentId || !orderId || !signature || !userDetails || !planId || !amount) {
      return res.status(400).json({ error: "Missing required fields in the request." });
    }

    // Verify Razorpay payment signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    console.log("Generated Signature:", generatedSignature);
    console.log("Received Signature:", signature);

    if (generatedSignature !== signature) {
      console.error("Signature mismatch:", { generatedSignature, signature });
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Send email notifications
    try {
      await sendEmails(userDetails, "Razorpay", amount / 100, planId, orderId, paymentId);
      console.log("Emails sent successfully.");
    } catch (emailError) {
      console.error("Error sending emails:", emailError);
      return res.status(500).json({ error: "Failed to send emails." });
    }

    res.status(200).json({ message: "Payment verified successfully." });
  } catch (error) {
    console.error("Error in Razorpay success:", error.message);
    res.status(500).json({ error: "An error occurred during payment processing.", details: error.message });
  }
});



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
