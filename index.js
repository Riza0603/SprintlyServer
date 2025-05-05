import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoute from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";    
import uploadRoutes from "./routes/uploadRoutes.js";
import tempTimeRoutes from "./routes/tempTimeRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js"
import requestRoutes from "./routes/requestRoutes.js";
 

import "./services/deadlineReminder.js";
import "./services/updateExperience.js";

const app = express();  // Initialize app before using it

app.use(bodyParser.json());  // Now it works because app is initialized
app.use(express.json());
app.use(cors({ origin: "*" }));
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"], // allow both 5173 and 5174
    credentials: true,
  }));

connectDB();

app.use("/auth", authRoutes);
app.use("/api", projectRoute);
app.use("/api", taskRoutes);
app.use("/api",authRoutes);
app.use("/api", uploadRoutes);

app.use("/api",tempTimeRoutes)
app.use("/api",notificationRoutes)
app.use("/admin",adminRoutes);
app.use("/requests",requestRoutes);

app.listen(5000, () => console.log("Server has started"));
 