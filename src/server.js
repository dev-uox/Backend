
// import express from "express";
// import paymentRoutes from "./Enroll.js";
// import Payemi from "./Payemi.js";
// import Finalize from "./Finalize.js"
// import Reminder from "./Reminder.js"

// import cors from "cors";

// const app = express();
// app.use(cors())

// app.use(express.json());
// app.use("/api/payment", paymentRoutes);
// app.use("/api/emi", Payemi);
// app.use("/api/final", Finalize);
// app.use("/api", Reminder);




// app.listen(5000, () => console.log("Server running on port 5000"));



import express from "express";
import cors from "cors";

import paymentRoutes from "./Enroll.js";
import Payemi from "./Payemi.js";
import Finalize from "./Finalize.js";
import Reminder from "./Reminder.js";

const app = express();
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/payment", paymentRoutes);
app.use("/api/emi", Payemi);
app.use("/api/final", Finalize);
app.use("/api", Reminder);

// 🔹 Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "Healthy",
    message: "Backend is running fine!",
    timestamp: new Date().toISOString(),
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



