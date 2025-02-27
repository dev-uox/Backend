import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';

const app = express();
const router = express.Router();
dotenv.config();

app.use(cors());
app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Nodemailer transport setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Route to create Razorpay order
router.post('/create-order', async (req, res) => {
  const { userId, courseId, planId, emiNumber, amount } = req.body;
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `emi_${planId}_${emiNumber}`,
      payment_capture: 1,
      notes: { userId, courseId, planId, emiNumber },
    });

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({
      error: error.message || 'Failed to create payment order',
    });
  }
});

// Route to verify Razorpay payment
// Route to verify Razorpay payment
router.post('/verify-payment', async (req, res) => {
  const { paymentId, orderId, signature, paymentData } = req.body;

  try {
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (generatedSignature !== signature) {
      console.log('Invalid Signature: Mismatch');
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Process payment and send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: paymentData.userId,  // User's email from payment data
      subject: 'Payment Confirmation',
      text: `Dear User,\n\nYour payment for EMI ${paymentData.emiNumber} has been successfully completed.\n\nCourse: ${paymentData.courseId}\nAmount: ₹${paymentData.amount}\n\nThank you for using our service!\n\nBest regards,\nThe Team`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    res.status(200).json({ success: true, message: 'Payment verified successfully and email sent' });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: error.message || 'Payment verification failed' });
  }
});


export default router;
