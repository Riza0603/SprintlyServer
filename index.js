import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoute from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import tempTimeRoutes from "./routes/tempTimeRoutes.js";


const app = express();  // Initialize app before using it

app.use(bodyParser.json());  // Now it works because app is initialized
app.use(express.json());
app.use(cors({ origin: "*" }));

connectDB();

app.use("/auth", authRoutes);
app.use("/api", projectRoute);
app.use("/api", taskRoutes);
app.use("/api",authRoutes)
app.use("/api",tempTimeRoutes)

app.listen(5000, () => console.log("Server has started"));
