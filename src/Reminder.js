import express from 'express';
import nodemailer from 'nodemailer';
import cors from "cors"
import dotenv from "dotenv"

const app = express();
const router = express.Router();

app.use(express.json());
app.use(cors())

dotenv.config();


router.post('/send-email', async (req, res) => {
  const { recipientEmail, subject, message } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });


    const mailOptions = {
      from: process.env.EMAIL_USER, // Replace with your email
      to: recipientEmail,
      subject,
      html: message,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send('Email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Failed to send email.');
  }
});

export default router

