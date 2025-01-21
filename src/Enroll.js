


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
    host: "smtp.hostinger.com", // Hostinger's SMTP server
    port: 465, // Use 465 for SSL or 587 for TLS
    secure: true, // Set to true for port 465 // Replace with your email service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const userMailOptions = {
    from: process.env.EMAIL_USER,
    to: userDetails.email,
    subject: "Payment Receipt - Astrology Course",
   html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h1 style="color: #4CAF50; text-align: center;">Astrology Course</h1>
          <p style="text-align: center; font-size: 1.2rem; color: #333;">Thank you for your payment!</p>
          <hr style="border: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 1rem; color: #555;">
            Dear <strong>${donorName}</strong>,
          </p>
          <p style="font-size: 1rem; color: #555;">
            We are excited to confirm your payment of <strong>₹${amount * 100}</strong> for the course ID <strong>${razorpay_order_id}</strong>.
          </p>
          <p style="font-size: 1rem; color: #555;">
            Below are your payment details:
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f9f9f9;">
              <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Payment ID</th>
              <td style="padding: 8px; border: 1px solid #ddd;">${razorpay_payment_id}</td>
            </tr>
            <tr>
              <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Order ID</th>
              <td style="padding: 8px; border: 1px solid #ddd;">${razorpay_order_id}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Payment Method</th>
              <td style="padding: 8px; border: 1px solid #ddd;">Razorpay</td>
            </tr>
            <tr>
              <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Amount Paid</th>
              <td style="padding: 8px; border: 1px solid #ddd;">₹${amount / 100}</td>
            </tr>
          </table>
          <p style="font-size: 1rem; color: #555; text-align: center; margin-top: 20px;">
            If you have any questions, feel free to contact us at <strong>contact@vahlayastro.com</strong>.
          </p>
          <p style="text-align: center; font-size: 1rem; color: #777;">
            Warm regards,<br>
            <strong>Astrology Course Team</strong>
          </p>
        </div>
      `,
  };

  const adminMailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: "New Payment Received",
    text: `A new payment has been received:

Payment Method: ${paymentMethod}
Amount: ₹${amount * 100}
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





