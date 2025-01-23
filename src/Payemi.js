
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
// app.use(
//   cors({
//     origin: ["http://localhost:5173", "https://vahlayastro.com"], // Replace with your frontend origin
//     methods: ["GET", "POST"],
//     allowedHeaders: ["Content-Type"],
//   })
// );

app.use(cors())

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Function to send emails
const sendEmails = async (userDetails, paymentMethod, amount, courseId) => {
  const formattedAmount = paymentMethod === "Razorpay" ? amount*100 : amount ;

  const transporter = nodemailer.createTransport({
    service: "gmail",
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
          Dear <strong>${userDetails.name}</strong>,
        </p>
        <p style="font-size: 1rem; color: #555;">
          We are excited to confirm your payment of <strong>₹${formattedAmount }</strong> for the course ID <strong>${courseId}</strong>.
        </p>
        <p style="font-size: 1rem; color: #555;">
          Below are your payment details:
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f9f9f9;">
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Payment ID</th>
            <td style="padding: 8px; border: 1px solid #ddd;">${paymentMethod}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Course ID</th>
            <td style="padding: 8px; border: 1px solid #ddd;">${courseId}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Payment Method</th>
            <td style="padding: 8px; border: 1px solid #ddd;">${paymentMethod}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Amount Paid</th>
            <td style="padding: 8px; border: 1px solid #ddd;">₹${formattedAmount}</td>
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
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h1 style="color: #FF5733; text-align: center; margin-bottom: 20px;">New Payment Received</h1>
        <p style="font-size: 1rem; color: #555;">A new payment has been received. Below are the details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 1rem;">
          <tr>
            <th style="text-align: left; padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;">Payment Method</th>
            <td style="padding: 10px; border: 1px solid #ddd;">${paymentMethod}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Amount</th>
            <td style="padding: 10px; border: 1px solid #ddd;">₹${formattedAmount}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;">Course ID</th>
            <td style="padding: 10px; border: 1px solid #ddd;">${courseId}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">User Details</th>
            <td style="padding: 10px; border: 1px solid #ddd; white-space: pre-wrap;">${JSON.stringify(userDetails, null, 2)}</td>
          </tr>
        </table>
        <p style="text-align: center; font-size: 1rem; color: #777; margin-top: 20px;">
          Best regards,<br>
          <strong>Payment System</strong>
        </p>
      </div>
    `,
  };

  // Send emails
  try {
    await transporter.sendMail(userMailOptions);
    await transporter.sendMail(adminMailOptions);
  } catch (error) {
    console.error("Error sending emails:", error.message);
    throw new Error("Failed to send emails.");
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
    const { paymentId, userDetails, courseId, amount } = req.body;

    // Validate required fields
    if (!paymentId || !userDetails || !courseId || !amount) {
      return res.status(400).json({ error: "Missing required fields in the request." });
    }

    console.log(`PayPal payment verified: ${paymentId}`);

    // Send emails after successful payment
    try {
      await sendEmails(userDetails, "PayPal", amount, courseId); // Dynamically handle PayPal as the payment method
      console.log("Emails sent successfully.");
    } catch (emailError) {
      console.error("Error sending emails:", emailError.message);
      return res.status(500).json({ error: "Failed to send emails." });
    }

    res.status(200).json({ message: "Payment verified and emails sent successfully." });
  } catch (error) {
    console.error("Error in PayPal success route:", error.message);
    res.status(500).json({ error: "An error occurred during payment processing." });
  }
});


export default router;
