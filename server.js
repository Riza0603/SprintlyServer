const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const taskRoutes = require("./routes/taskRoutes"); // Import Task Routes

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: "*" })); // Adjust as needed for frontend origin

// MongoDB Connection
const dbURI = "mongodb+srv://sprintly-ganglia:sprintly-ganglia0601@sprintly-ganglia.w1fqw.mongodb.net/SprintlyDB?retryWrites=true&w=majority";
mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Error connecting to MongoDB:", err));

// Task Routes
app.use("/api", taskRoutes); // All task-related routes

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
