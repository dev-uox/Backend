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
app.use(
  cors({
    origin: ["http://localhost:5173","https://vahlayastro.com"], // Replace with your frontend origin
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Function to send emails
const sendEmails = async (userDetails, paymentMethod, amount, planId, orderId) => {
  const customerName = userDetails?.name || "Valued Customer";
  const customerEmail = userDetails?.email || "No email provided";
  const plan = planId || "Not Available";
  const order = orderId || "Not Available";
const paidAmount = amount && !isNaN(amount) ? `₹${(amount / 100).toFixed(2)}` : "Not Available";
  
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const userMailOptions = {
    from: process.env.EMAIL_USER,
    to: customerEmail,
    subject: "Payment Confirmation",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
        <h1 style="text-align: center; color: #4CAF50;">Thank You for Your Payment!</h1>
        <p style="text-align: center;">Dear <strong>${customerName}</strong>,</p>
        <p>We are pleased to confirm your payment. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;">Plan ID</th>
            <td style="padding: 8px; border: 1px solid #ddd;">${plan}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Order ID</th>
            <td style="padding: 8px; border: 1px solid #ddd;">${order}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;">Amount Paid</th>
            <td style="padding: 8px; border: 1px solid #ddd;">${paidAmount}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Payment Method</th>
            <td style="padding: 8px; border: 1px solid #ddd;">${paymentMethod}</td>
          </tr>
        </table>
        <p>If you have any questions, feel free to contact us at <a href="mailto:contact@vahlayastro.com">contact@vahlayastro.com</a>.</p>
      </div>
    `,
  };

  const adminMailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: "New Payment Received",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #fff;">
        <h1 style="text-align: center; color: #FF5733;">New Payment Received</h1>
        <p>A new payment has been received with the following details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;">Customer Name</th>
            <td style="padding: 8px; border: 1px solid #ddd;">${customerName}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Customer Email</th>
            <td style="padding: 8px; border: 1px solid #ddd;">${customerEmail}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;">Plan ID</th>
            <td style="padding: 8px; border: 1px solid #ddd;">${plan}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Order ID</th>
            <td style="padding: 8px; border: 1px solid #ddd;">${order}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;">Amount Paid</th>
            <td style="padding: 8px; border: 1px solid #ddd;">${paidAmount}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Payment Method</th>
            <td style="padding: 8px; border: 1px solid #ddd;">${paymentMethod}</td>
          </tr>
        </table>
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

    if (!amount) {
      return res.status(400).json({ error: "Amount is required." });
    }

    const options = {
      amount: amount * 100, // Amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({ orderId: order.id });
  } catch (error) {
    console.error("Error creating Razorpay order:", error.message);
    res.status(500).json({ error: "Failed to create Razorpay order." });
  }
});

// Route to handle Razorpay payment success
router.post("/razorpay/success", async (req, res) => {
  try {
    const { paymentId, orderId, signature, userDetails, planId, amount } = req.body;

    if (!paymentId || !orderId || !signature || !userDetails || !planId || !amount) {
      return res.status(400).json({ error: "Missing required fields in the request." });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (generatedSignature !== signature) {
      return res.status(400).json({ error: "Invalid payment signature." });
    }

    try {
      await sendEmails(userDetails, "Razorpay", amount / 100, planId, orderId);
      console.log("Emails sent successfully.");
    } catch (emailError) {
      console.error("Error sending emails:", emailError.message);
      return res.status(500).json({ error: "Failed to send emails." });
    }

    res.status(200).json({ message: "Payment verified successfully." });
  } catch (error) {
    console.error("Error in Razorpay success:", error.message);
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

    console.log(`Payment verified: ${paymentId}`);

    await sendEmails(userDetails, "PayPal", amount, planId);

    res.status(200).json({ message: "Payment verified and emails sent." });
  } catch (error) {
    console.error("Error in PayPal success:", error.message);
    res.status(500).json({ error: "An error occurred during payment processing." });
  }
});

export default router;
