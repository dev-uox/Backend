// import express from 'express';
// import cors from 'cors';
// import nodemailer from 'nodemailer';
// import dotenv from 'dotenv';

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Nodemailer Transporter
// const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 587,
//   secure: false,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// // Test the transporter
// transporter.verify((error, success) => {
//   if (error) {
//     console.error('Error verifying transporter:', error);
//   } else {
//     console.log('Nodemailer is ready to send emails.');
//   }
// });

// // Email API Endpoint
// app.post('/send-email', async (req, res) => {
//   const { to, subject, text } = req.body;

//   try {
//     const info = await transporter.sendMail({
//       from: `"Your App" <${process.env.EMAIL_USER}>`,
//       to,
//       subject,
//       text,
//     });
//     res.status(200).send({ message: 'Email sent successfully!', info });
//   } catch (error) {
//     console.error('Error sending email:', error);
//     res.status(500).send({ message: 'Failed to send email.', error: error.message });
//   }
// });

// // Start Server
// app.listen(PORT, () => {
//   console.log(`Backend running on http://localhost:${PORT}`);
// });





import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import nodemailer from "nodemailer";
import crypto from "crypto";
import bodyParser from "body-parser";


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());


// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper function to send emails
const sendEmails = async (userEmail, userName, courseName, amount) => {
  try {
    const userEmailTemplate = `
      <h2>Dear ${userName},</h2>
      <p>Thank you for enrolling in ${courseName}.</p>
      <p>Your payment of ₹${amount} was successful.</p>
      <p>Best Regards,<br>Astrology Academy</p>
    `;

    const adminEmailTemplate = `
      <h2>Admin Notification</h2>
      <p>${userName} has successfully enrolled in ${courseName}.</p>
      <p>Amount Paid: ₹${amount}</p>
    `;

    // Send email to the user
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: "Payment Successful - Astrology Academy",
      html: userEmailTemplate,
    });

    // Send email to yourself (the sender)
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Sending to the sender's email
      subject: "New Enrollment Notification",
      html: adminEmailTemplate,
    });

    console.log("Emails sent successfully!");
  } catch (error) {
    console.error("Error sending emails:", error.message);
  }
};

// Razorpay order creation
app.post("/api/payment/razorpay/create-order", async (req, res) => {
  try {
    const { amount, currency } = req.body;

    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency,
      receipt: `receipt_${Date.now()}`,
    });

    res.status(200).json(order);
  } catch (error) {
    console.error("Error creating Razorpay order:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Razorpay payment verification
app.post("/api/payment/razorpay/confirm-payment", async (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    email,
    userName,
    courseName,
    amount,
  } = req.body;

  try {
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature === razorpay_signature) {
      // Send emails
      await sendEmails(email, userName, courseName, amount);
      res.status(200).json({ success: true, message: "Payment confirmed and emails sent!" });
    } else {
      res.status(400).json({ success: false, message: "Invalid payment signature" });
    }
  } catch (error) {
    console.error("Error confirming Razorpay payment:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PayPal order creation and confirmation
app.post("/api/payment/paypal/create-order", async (req, res) => {
  const { amount, email, userName, courseName } = req.body;

  try {
    // Simulate PayPal order creation (replace with actual PayPal SDK logic)
    const orderID = `PAYPAL_${Date.now()}`;

    res.status(200).json({ orderID });

    // Send emails (Assume payment is confirmed immediately for simplicity)
    await sendEmails(email, userName, courseName, amount);
  } catch (error) {
    console.error("Error creating PayPal order:", error.message);
    res.status(500).json({ error: error.message });
  }
});




// FOR PAY EMI PAGE 




// const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });
  
  // Endpoint to create a Razorpay order
  app.post("/create-order", async (req, res) => {
    try {
      const { amount } = req.body;
  
      const options = {
        amount: amount * 100, // Amount in paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };
  
      const order = await razorpay.orders.create(options);
      res.json({ success: true, order });
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });
  
  // Endpoint to verify payment signature and send emails
  app.post("/verify-payment", async (req, res) => {
    try {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature, userEmail, userName, courseName } = req.body;
  
      // Verify payment signature (optional, for enhanced security)
      const crypto = await import("crypto");
      const hmac = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");
  
      if (hmac !== razorpay_signature) {
        return res.status(400).json({ success: false, message: "Payment verification failed" });
      }
  
      // Send email to the user
      const userMailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: "Payment Confirmation",
        html: `
          <h3>Hi ${userName},</h3>
          <p>Your payment for the course <strong>${courseName}</strong> has been successfully processed.</p>
          <p>Payment ID: <strong>${razorpay_payment_id}</strong></p>
          <p>Thank you for your payment!</p>
        `,
      };
  
      // Send email to the admin
      const adminMailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: "New Payment Received",
        html: `
          <h3>New Payment Received</h3>
          <p>Payment for the course <strong>${courseName}</strong> was successfully processed.</p>
          <p>User Name: <strong>${userName}</strong></p>
          <p>User Email: <strong>${userEmail}</strong></p>
          <p>Payment ID: <strong>${razorpay_payment_id}</strong></p>
        `,
      };
  
      // Send emails
      await transporter.sendMail(userMailOptions);
      await transporter.sendMail(adminMailOptions);
  
      res.json({ success: true, message: "Payment verified and emails sent" });
    } catch (error) {
      console.error("Error verifying payment or sending email:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });








  // for finalize




// Endpoint to create Razorpay order
app.post("/create-order-final", async (req, res) => {
    const { amount, courseId, emiNumber } = req.body;
  
    try {
      // Generate a receipt string with a maximum length of 40 characters
      const receipt = `rec_${courseId}_${emiNumber}`.substring(0, 40);
  
      const options = {
        amount: amount * 100, // Convert amount to paise
        currency: "INR",
        receipt: receipt,
      };
  
      const order = await razorpay.orders.create(options);
      res.status(200).json({ success: true, order });
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({ success: false, message: "Failed to create order" });
    }
  });
  
  // Endpoint to verify payment and send emails
  app.post("/verify-payment-final", async (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, userEmail, userName, courseId, emiNumber } = req.body;
  
    try {
      // Verify payment signature (optional but recommended)
      const crypto = await import("crypto");
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");
  
      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: "Payment verification failed" });
      }
  
      // Send email to user
      const userMailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: "EMI Payment Confirmation",
        html: `
          <h3>Hello ${userName},</h3>
          <p>We have received your payment for EMI #${emiNumber} of course <strong>${courseId}</strong>.</p>
          <p>Payment ID: <strong>${razorpay_payment_id}</strong></p>
          <p>Thank you for your payment!</p>
        `,
      };
  
      // Send email to admin
      const adminMailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: "New EMI Payment Received",
        html: `
          <h3>New EMI Payment Received</h3>
          <p>Payment details:</p>
          <ul>
            <li>User Name: ${userName}</li>
            <li>User Email: ${userEmail}</li>
            <li>Course ID: ${courseId}</li>
            <li>EMI Number: ${emiNumber}</li>
            <li>Payment ID: ${razorpay_payment_id}</li>
          </ul>
        `,
      };
  
      // Send emails
      await transporter.sendMail(userMailOptions);
      await transporter.sendMail(adminMailOptions);
  
      res.status(200).json({ success: true, message: "Payment verified and emails sent" });
    } catch (error) {
      console.error("Error verifying payment or sending email:", error);
      res.status(500).json({ success: false, message: "Failed to verify payment or send emails" });
    }
  });





// for finalize all pay


// Endpoint to create Razorpay order for all unpaid EMIs
app.post("/create-order-all-emis", async (req, res) => {
  const { totalAmount, courseId } = req.body;

  try {
    // Generate a receipt with a maximum length of 40 characters
    const receipt = `rec_all_emis_${courseId}`.substring(0, 40);

    const options = {
      amount: totalAmount * 100, // Convert amount to paise
      currency: "INR",
      receipt: receipt,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Error creating Razorpay order for all EMIs:", error);
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
});


// Payment Verification Endpoint (Optional)
// Endpoint to verify payment and send email for all EMIs
app.post("/verify-payment-all-emis", async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, userEmail, userName, courseId, emis } = req.body;

  try {
    // Verify payment signature
    const crypto = await import("crypto");
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    // Send email to the user
    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: "EMI Payment Confirmation - All EMIs",
      html: `
        <h3>Hello ${userName},</h3>
        <p>We have received your payment for all remaining EMIs of course <strong>${courseId}</strong>.</p>
        <p>Payment ID: <strong>${razorpay_payment_id}</strong></p>
        <p>Thank you for your payment!</p>
      `,
    };

    // Send email to the admin
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: "New Bulk EMI Payment Received",
      html: `
        <h3>New Bulk EMI Payment Received</h3>
        <p>Payment details:</p>
        <ul>
          <li>User Name: ${userName}</li>
          <li>User Email: ${userEmail}</li>
          <li>Course ID: ${courseId}</li>
          <li>Total EMIs Paid: ${emis.length}</li>
          <li>Payment ID: ${razorpay_payment_id}</li>
        </ul>
      `,
    };

    // Send emails
    await transporter.sendMail(userMailOptions);
    await transporter.sendMail(adminMailOptions);

    res.status(200).json({ success: true, message: "Payment verified and emails sent" });
  } catch (error) {
    console.error("Error verifying payment or sending emails:", error);
    res.status(500).json({ success: false, message: "Failed to verify payment or send emails" });
  }
});




  
// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


