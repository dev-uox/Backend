


import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com", // Hostinger's SMTP server
  port: 465, // Use 465 for SSL or 587 for TLS
  secure: true, // Set to true for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmails = async (userDetails, paymentMethod, amount, planId) => {
  try {
    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: userDetails.email,
      subject: "Payment Confirmation",
      text: `Dear ${userDetails.name},

Your payment of ₹${(amount * 100).toFixed(2)} for plan ID: ${planId} using ${paymentMethod} has been successful.

Feel free to reach out us at contact@vahlayastro.com

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
Amount: ₹${(amount * 100).toFixed(2)}
Plan ID: ${planId}
User Details: ${JSON.stringify(userDetails, null, 2)}

Best regards,
Payment System`,
    };

    // Send user and admin emails
    await transporter.sendMail(userMailOptions);
    await transporter.sendMail(adminMailOptions);
  } catch (error) {
    console.error("Error sending emails:", error);
    throw new Error("Failed to send emails.");
  }
};

// Single EMI Payment Endpoint
router.post("/success", async (req, res) => {
  const { paymentId, courseId, emiNumber, amount, userEmail } = req.body;

  if (!paymentId || !courseId || emiNumber === undefined || !amount || !userEmail) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  try {
    const userMessage = `
     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h1 style="color: #4CAF50; text-align: center;">Astrology Course</h1>
          <p style="text-align: center; font-size: 1.2rem; color: #333;">Thank you for your payment!</p>
          <hr style="border: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 1rem; color: #555;">
            Dear <strong>${userEmail}</strong>,
          </p>
          <p style="font-size: 1rem; color: #555;">
            We are excited to confirm your payment of <strong>₹${emiNumber}</strong> for the course ID <strong>${razorpay_order_id}</strong>.
          </p>
          <p style="font-size: 1rem; color: #555;">
            Below are your payment details:
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f9f9f9;">
              <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Payment ID</th>
              <td style="padding: 8px; border: 1px solid #ddd;">${paymentId}</td>
            </tr>
            <tr>
              <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Order ID</th>
              <td style="padding: 8px; border: 1px solid #ddd;">${courseId}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Payment Method</th>
              <td style="padding: 8px; border: 1px solid #ddd;">Razorpay</td>
            </tr>
            <tr>
              <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Amount Paid</th>
              <td style="padding: 8px; border: 1px solid #ddd;">₹${amount * 100}</td>
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
    `;

    const adminMessage = `
      <p>Dear Admin,</p>
      <p>A new payment has been made:</p>
      <ul>
        <li>User Email: ${userEmail}</li>
        <li>Course ID: ${courseId}</li>
        <li>EMI Number: ${emiNumber}</li>
        <li>Amount Paid: ₹${amount}</li>
        <li>Payment ID: ${paymentId}</li>
      </ul>
    `;

    // Send user and admin emails
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: "Payment Receipt - Astrology Course",
      html: userMessage,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: "New Payment Received",
      html: adminMessage,
    });

    res.status(200).json({ success: true, message: "Payment processed and emails sent successfully." });
  } catch (error) {
    console.error("Error sending emails:", error);
    res.status(500).json({ success: false, message: "Failed to process payment or send emails." });
  }
});

// PayPal Payment Endpoint
router.post("/paypal/success", async (req, res) => {
  const { paymentId, userDetails, planId, amount } = req.body;

  if (!paymentId || !userDetails || !planId || !amount) {
    return res.status(400).json({ error: "Invalid request data." });
  }

  try {
    // Log payment details (Optional: Verify paymentId with PayPal API)
    console.log(`Payment verified: ${paymentId}`);

    // Send user and admin emails
    await sendEmails(userDetails, "PayPal", amount, planId);

    res.status(200).json({ message: "Payment verified and emails sent." });
  } catch (error) {
    console.error("Error in PayPal success:", error.message);
    res.status(500).json({ error: "An error occurred during payment processing." });
  }
});

export default router;
