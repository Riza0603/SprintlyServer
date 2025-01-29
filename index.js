import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();
app.use(express.json());
app.use(cors());

connectDB();

app.use("/auth", authRoutes);

app.listen(3002, () => console.log("Server has started"));
