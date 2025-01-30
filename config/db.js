const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://sprintly-ganglia:sprintly-ganglia0601@sprintly-ganglia.w1fqw.mongodb.net/SprintlyDB?retryWrites=true&w=majority");
    console.log("Connected to MongoDB database");
  } catch (error) {
    console.error("Error connecting to database:", error);
  }
};

module.exports = connectDB;
