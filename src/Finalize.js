import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import cors from "cors"

dotenv.config();

const app = express()
app.use(cors())
const router = express.Router();

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmails = async (userDetails, paymentMethod, amount, courseId) => {
  const formattedAmount = parseFloat(amount).toFixed(2); // Format amount to two decimal places

  // Nodemailer transporter configuration
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
    to: userDetails.email,
    subject: "Payment Confirmation - EMI Payment",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px; background-color: #f9f9f9;">
        <h1 style="color: #4CAF50; text-align: center;">Payment Confirmation</h1>
        <p style="font-size: 1.2rem; color: #333; text-align: center;">Thank you for your payment!</p>
        <hr style="border: 1px solid #ddd; margin: 20px 0;">
        <p>Dear ${userDetails.name},</p>
        <p>We have successfully received your payment for the following:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Course ID</th>
            <td style="padding: 10px; border: 1px solid #ddd;">${courseId}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Payment Method</th>
            <td style="padding: 10px; border: 1px solid #ddd;">${paymentMethod}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Amount Paid</th>
            <td style="padding: 10px; border: 1px solid #ddd;">₹${formattedAmount}</td>
          </tr>
        </table>
        <p>If you have any questions, feel free to reach out to us at <a href="mailto:contact@vahlayastro.com" style="color: #4CAF50;">contact@vahlayastro.com</a>.</p>
        <p style="text-align: center;">Thank you for trusting us!</p>
        <p style="text-align: center;">Best regards,<br><strong>EMI Payment Team</strong></p>
      </div>
    `,
  };

  // Admin email template
  const adminMailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: "New Payment Received",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px; background-color: #f9f9f9;">
        <h1 style="color: #FF5733; text-align: center;">New Payment Notification</h1>
        <p>A new payment has been received. Below are the details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #e9f5e9;">
            <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Payment Method</th>
            <td style="padding: 10px; border: 1px solid #ddd;">${paymentMethod}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Amount</th>
            <td style="padding: 10px; border: 1px solid #ddd;">₹${formattedAmount}</td>
          </tr>
          <tr style="background-color: #e9f5e9;">
            <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Course ID</th>
            <td style="padding: 10px; border: 1px solid #ddd;">${courseId}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">User Details</th>
            <td style="padding: 10px; border: 1px solid #ddd;">${JSON.stringify(userDetails, null, 2)}</td>
          </tr>
        </table>
        <p style="text-align: center;">Best regards,<br><strong>Payment System</strong></p>
      </div>
    `,
  };

  // Sending the emails
  try {
    await transporter.sendMail(userMailOptions);
    await transporter.sendMail(adminMailOptions);
  } catch (error) {
    console.error("Error sending emails:", error.message);
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
     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
  <h1 style="color: #4CAF50; text-align: center; margin-bottom: 20px;">Thank You for Your Payment!</h1>
  <p style="font-size: 1rem; color: #333;">Dear User,</p>
  <p style="font-size: 1rem; color: #555;">We have successfully received your payment. Below are the payment details:</p>
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 1rem;">
    <tr>
      <th style="text-align: left; padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;">Course ID</th>
      <td style="padding: 10px; border: 1px solid #ddd;">${courseId}</td>
    </tr>
    <tr>
      <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">EMI Number</th>
      <td style="padding: 10px; border: 1px solid #ddd;">${emiNumber}</td>
    </tr>
    <tr>
      <th style="text-align: left; padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;">Amount Paid</th>
      <td style="padding: 10px; border: 1px solid #ddd;">₹${amount}</td>
    </tr>
    <tr>
      <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Payment ID</th>
      <td style="padding: 10px; border: 1px solid #ddd;">${paymentId}</td>
    </tr>
  </table>
  <p style="font-size: 1rem; color: #555; text-align: center; margin-top: 20px;">
    If you have any questions, feel free to contact us at <a href="mailto:contact@vahlayastro.com" style="color: #4CAF50;">contact@vahlayastro.com</a>.
  </p>
  <p style="text-align: center; font-size: 1rem; color: #777; margin-top: 20px;">
    Warm regards,<br>
    <strong>Vahlay Astro Team</strong>
  </p>
</div>

    `;

    const adminMessage = `
     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
  <h1 style="color: #FF5733; text-align: center; margin-bottom: 20px;">New Payment Notification</h1>
  <p style="font-size: 1rem; color: #555;">Dear Admin,</p>
  <p style="font-size: 1rem; color: #555;">A new payment has been made. Below are the details:</p>
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 1rem;">
    <tr>
      <th style="text-align: left; padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;">User Email</th>
      <td style="padding: 10px; border: 1px solid #ddd;">${userEmail}</td>
    </tr>
    <tr>
      <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Course ID</th>
      <td style="padding: 10px; border: 1px solid #ddd;">${courseId}</td>
    </tr>
    <tr>
      <th style="text-align: left; padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;">EMI Number</th>
      <td style="padding: 10px; border: 1px solid #ddd;">${emiNumber}</td>
    </tr>
    <tr>
      <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Amount Paid</th>
      <td style="padding: 10px; border: 1px solid #ddd;">₹${amount}</td>
    </tr>
    <tr>
      <th style="text-align: left; padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;">Payment ID</th>
      <td style="padding: 10px; border: 1px solid #ddd;">${paymentId}</td>
    </tr>
  </table>
  <p style="text-align: center; font-size: 1rem; color: #777; margin-top: 20px;">
    Please log in to the admin dashboard for further details.
  </p>
</div>

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

router.post("/paypal/success", async (req, res) => {
  try {
    const { paymentId, userDetails, amount, courseId } = req.body;

    // Validate request data
    if (
      !paymentId ||
      !userDetails ||
      typeof userDetails !== "object" ||
      !userDetails.email ||
      !userDetails.name ||
      !courseId ||
      !amount
    ) {
      console.error("Missing fields:", { paymentId, userDetails, amount, courseId });
      return res.status(400).json({ error: "Missing required fields in the request." });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.error("ADMIN_EMAIL is not defined in the environment variables.");
      return res.status(500).json({ error: "Server configuration error. Admin email is missing." });
    }

    // Log details for debugging
    console.log("PayPal payment verified:", { paymentId, userDetails, amount, courseId });

    // Send confirmation emails
    await sendEmails(userDetails, "PayPal", amount, courseId);

    // Return success response
    res.status(200).json({ message: "Payment verified and emails sent successfully." });
  } catch (error) {
    console.error("Error in PayPal success route:", error.message);
    res.status(500).json({ error: "An error occurred during payment processing." });
  }
});




export default router;







