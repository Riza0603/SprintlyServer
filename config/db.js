const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const dbURI = "mongodb+srv://sprintly-ganglia:<db_password>@sprintly-ganglia.w1fqw.mongodb.net/?retryWrites=true&w=majority&appName=sprintly-ganglia"; 
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB Atlas");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); 
  }
};

module.exports = connectDB;
