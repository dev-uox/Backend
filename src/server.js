import express from "express";
import cors from "cors";
import morgan from "morgan"

import paymentRoutes from "./Enroll.js";
import Payemi from "./Payemi.js";
import Finalize from "./Finalize.js";
import Reminder from "./Reminder.js";
import Meeting from "./Meeting.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// API Routes
app.use("/api/payment", paymentRoutes);
app.use("/api/emi", Payemi);
app.use("/api/final", Finalize);
app.use("/api", Reminder);
app.use("/meeting", Meeting);


// 🔹 Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "Healthy",
    message: "Backend is running fine!",
    timestamp: new Date().toISOString(),
  });
});


const PORT = process.env.PORT || 5000;

// Log before starting the server
console.log("🚀 Server is starting...");

app.use((req, res, next) => {
  console.log(`🔍 Incoming Request: ${req.method} ${req.url}`);
  next();
});


// Start Express Server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
