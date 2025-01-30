const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const argon2 = require("argon2")
const UserModel = require("./models/Users.js")
const jwt = require("jsonwebtoken")
const nodemailer = require("nodemailer")
const taskRoutes = require('./routes/taskRoutes');
const bodyParser = require("body-parser");
const ConnectDb=require('./config/db.js')
// import connectDB from "./config/db.js"
const projectRoute = require('./routes/projectRoute.js');



const app = express()
app.use(bodyParser.json());
app.use(cors({origin: "*"}));

// const MONGO_URI = "mongodb+srv://sprintly-ganglia:sprintly-ganglia0601@sprintly-ganglia.w1fqw.mongodb.net/SprintlyDB?retryWrites=true&w=majority&appName=sprintly-ganglia";


// mongoose.connect(MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => console.log('Connected to MongoDB Atlas'))
// .catch(err => {
//   console.error('MongoDB connection error:', err);
// });
ConnectDb();
app.use("/api", projectRoute);
app.use("/api", taskRoutes); // All task-related routes


app.post("/signup",(req,res)=>{
    UserModel.create(req.body).then(u=>res.json(u)).catch(e=>res.json(e))
})


app.post("/login", async (req, res) => {
    try {
        console.log("received");
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.json({ message: "No such user! Please Sign up." });
        }

        const passwordIsValid = await argon2.verify(user.password, password);

        if (passwordIsValid) {
            console.log("Login successful");
            return res.json({ message: "Login Successful", user });
        } else {
            console.log("Password mismatch!");
            return res.json({ message: "Invalid Password" });
        }
    } catch (error) {
        console.log("Error during login:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
  
    const user = await UserModel.findOne({ email }); 
    if (user) {
      const token = jwt.sign({id: user._id}, "jwt_secret_key",{expiresIn: "1h"});
      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'riza.ganglia@gmail.com',
          pass: 'rptt vygb qrix xyeq'
        }
      });
      
      var mailOptions = {
        from: 'riza.ganglia@gmail.com',
        to: email,
        subject: 'Reset Password',
        text: `http://localhost:5174/reset-password/${user._id}/${token}`  // Fixed string interpolation
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          return res.send({ Status: "Success" });
        }
      });
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
});

app.post('/reset-password/:id/:token', async (req, res) => {
    const { id, token } = req.params;
    const { password } = req.body;
  
    try {
      const decoded = jwt.verify(token, "jwt_secret_key");  // Verify the token
      if (decoded.id !== id) {
        return res.status(400).json({ message: "Invalid reset token." });
      }
  
      const hashedPassword = await argon2.hash(password);  // Hash the new password
      await UserModel.findByIdAndUpdate(id, { password: hashedPassword });  // Update the password
  
      return res.json({ success: true, message: 'Password updated successfully.' });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: 'Failed to reset password. Token may have expired.' });
    }
  });
   



  const PORT=5000;

  app.listen(PORT, () =>{
      console.log("server is running on port 5000");
  })