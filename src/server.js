
import express from "express";
import paymentRoutes from "./Enroll.js";
import Payemi from "./Payemi.js";
import Finalize from "./Finalize.js"
import Reminder from "./Reminder.js"

import cors from "cors";

const app = express();
app.use(cors())

app.use(express.json());
app.use("/api/payment", paymentRoutes);
app.use("/api/emi", Payemi);
app.use("/api/payment", Finalize);
app.use("/api", Reminder);




app.listen(5000, () => console.log("Server running on port 5000"));


