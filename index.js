const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db.js");
const authRoutes = require("./routes/authRoutes.js");
const projectRoute = require('./routes/projectRoute.js');
const taskRoutes = require('./routes/taskRoutes');
const bodyParser = require("body-parser");

app.use(bodyParser.json());
const app = express();
app.use(express.json());
app.use(cors({origin: "*"}));

connectDB();

app.use("/auth", authRoutes);
app.use("/api", projectRoute);
app.use("/api", taskRoutes);

app.listen(3002, () => console.log("Server has started"));
