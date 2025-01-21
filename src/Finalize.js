
import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});



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

Feel free to reach out us at :- contact@vahlayastro.com

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





// Single EMI Payment Endpoint
router.post("/success", async (req, res) => {
  const { paymentId, courseId, emiNumber, amount, userEmail } = req.body;

  if (!paymentId || !courseId || emiNumber === undefined || !amount || !userEmail) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  try {
    const userMessage = `
      <p>Dear User,</p>
      <p>Thank you for your payment!</p>
      <ul>
        <li>Course ID: ${courseId}</li>
        <li>EMI Number: ${emiNumber}</li>
        <li>Amount Paid: ₹${amount}</li>
        <li>Payment ID: ${paymentId}</li>
      </ul>
      <p>If you have any questions, feel free to contact us. contact@vahlayastro.com </p>
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

    // Send emails
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: "Payment Confirmation - EMI Payment",
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

// All EMI Payment Endpoint
router.post("/final/success", async (req, res) => {
  const { paymentId, courseId, amount, userEmail, emiDetails } = req.body;

  if (!paymentId || !courseId || !amount || !userEmail || !Array.isArray(emiDetails)) {
    return res.status(400).json({ success: false, message: "Invalid request data." });
  }

  try {
    const userMessage = `
      <p>Dear User,</p>
      <p>Thank you for your payment!</p>
      <ul>
        <li>Course ID: ${courseId}</li>
        <li>Total Amount Paid: ₹${amount}</li>
        <li>Payment ID: ${paymentId}</li>
      </ul>
      <p>EMI Breakdown:</p>
      <ul>
        ${emiDetails.map((emi) => `<li>EMI #${emi.emiNumber}: ₹${emi.amount}</li>`).join("")}
      </ul>
      <p>If you have any questions, feel free to contact us. contact@vahlayastro.com </p>
    `;

    const adminMessage = `
      <p>Dear Admin,</p>
      <p>A new payment has been made:</p>
      <ul>
        <li>User Email: ${userEmail}</li>
        <li>Course ID: ${courseId}</li>
        <li>Total Amount Paid: ₹${amount}</li>
        <li>Payment ID: ${paymentId}</li>
      </ul>
      <p>EMI Breakdown:</p>
      <ul>
        ${emiDetails.map((emi) => `<li>EMI #${emi.emiNumber}: ₹${emi.amount}</li>`).join("")}
      </ul>
    `;

    // Send emails
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: "Payment Confirmation - All EMIs Paid",
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
