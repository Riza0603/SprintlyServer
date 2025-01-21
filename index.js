const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const argon2 = require("argon2")
const UserModel = require("./models/Users.js")
const jwt = require("jsonwebtoken")
const nodemailer = require("nodemailer")

const app = express()
app.use(express.json())
app.use(cors({ origin: 'http://localhost:5174' })); // Replace with your frontend URL

try{
    mongoose.connect("mongodb://127.0.0.1:27017/Sprintly")
    console.log("connected to mongodb database")
}catch(error){
    console.log("error connecting to database"+ error)
}

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
   



app.listen(3002,()=>{console.log("Server has started")})