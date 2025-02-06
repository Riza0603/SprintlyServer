import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const dbURI = "mongodb+srv://sprintly-ganglia:sprintly-ganglia0601@sprintly-ganglia.w1fqw.mongodb.net/SprintlyDB?retryWrites=true&w=majority"; 
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

// Export using ES module syntax
export default connectDB;
