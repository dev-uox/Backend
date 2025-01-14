import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Test the transporter
transporter.verify((error, success) => {
  if (error) {
    console.error('Error verifying transporter:', error);
  } else {
    console.log('Nodemailer is ready to send emails.');
  }
});

// Email API Endpoint
app.post('/send-email', async (req, res) => {
  const { to, subject, text } = req.body;

  try {
    const info = await transporter.sendMail({
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    res.status(200).send({ message: 'Email sent successfully!', info });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send({ message: 'Failed to send email.', error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
