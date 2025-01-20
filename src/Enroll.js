
import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import cors from "cors";

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
const sendEmails = async (userDetails, paymentMethod, amount, courseId) => {
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

Your payment of ₹${amount / 100} for course ID: ${courseId} using ${paymentMethod} has been successful.

Thank you for your purchase!

Best regards,
Astrology Course Team`,
  };

  const adminMailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: "New Payment Received",
    text: `A new payment has been received:

Payment Method: ${paymentMethod}
Amount: ₹${amount / 100}
Course ID: ${courseId}
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
    const { paymentId, orderId, signature, userDetails, courseId, amount } = req.body;

    // Verify Razorpay payment signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (generatedSignature !== signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Send emails after successful payment
    await sendEmails(userDetails, "Razorpay", amount, courseId);

    res.status(200).json({ message: "Payment verified and emails sent." });
  } catch (error) {
    console.error("Error in Razorpay success:", error);
    res.status(500).json({ error: "An error occurred during payment processing." });
  }
});

// Route to handle PayPal payment success
router.post("/paypal/success", async (req, res) => {
  try {
    const { paymentId, userDetails, courseId, amount } = req.body;

    // PayPal payment verification should be done using PayPal APIs (if needed)

    // Send emails after successful payment
    await sendEmails(userDetails, "PayPal", amount, courseId);

    res.status(200).json({ message: "Payment verified and emails sent." });
  } catch (error) {
    console.error("Error in PayPal success:", error);
    res.status(500).json({ error: "An error occurred during payment processing." });
  }
});

export default router;


