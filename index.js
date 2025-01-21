import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import UserModel from "./models/Users.js"; // ES module import
import UserOtp from "./models/UserOtpVerification.js"; // Import UserOtp model
import nodemailer from "nodemailer";
import argon2 from 'argon2';
import bcrypt from 'bcrypt';
import UserOtpVerification from "./models/UserOtpVerification.js";

const app = express();
app.use(express.json());
app.use(cors());

// Nodemailer transporter setup
var transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "shreyas.ganglia@gmail.com",
    pass: "dahv ozwa kfzc ycob",
  },
  debug: true, 
});

// Database connection
try {
  mongoose.connect("mongodb://127.0.0.1:27017/");
  console.log("connected to mongodb database");
} catch (error) {
  console.log("error connecting to database" + error);
}

app.post("/signup", async (req, res) => {
  console.log("signup");
  const { name, email, verificationCode } = req.body;

  try {
    // Hash OTP using bcrypt
    const saltRounds = 10;
    const hashedOTP = await bcrypt.hash(verificationCode, saltRounds);
    console.log("Hashed OTP: ", hashedOTP);

    // Create the user and get the user ID
    const newUser = await UserModel.create(req.body);

    // Save the OTP with the user ID in the UserOtpVerification model
    const newUserOtp = new UserOtp({
      userId: newUser._id,  // Save the new user's ID
      otp: hashedOTP,        // Store the hashed OTP
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,  // OTP expiration time (1 hour)
    });

    await newUserOtp.save();
    console.log("OTP saved in UserOtpVerification model");

    // Send OTP email to the user
    var mailOptions = {
      from: "Sprintly",
      to: email,
      subject: "Verify Your Email",
      text: "OTP: " + verificationCode,  // Send plain OTP to the user
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error sending OTP email." });
      } else {
        console.log("Email sent: " + info.response);
        res.json({ success: true, message: "User created and email sent." });
      }
    });
  } catch (e) {
    console.error("Error during signup:", e);
    res.status(500).json({ success: false, message: "Error creating user." });
  }
});

app.post("/login", async (req, res) => {
  console.log("Request received");
  try {
    const uf = await UserModel.findOne({ email: req.body.email });
    if (uf) {
      const vp = await argon2.verify(uf.password, req.body.password);
      if (vp) {
        res.json({ success: true, message: "Login Successful!" });
      } else {
        res.json({ success: false, message: "Invalid Password" });
      }
    } else {
      res.json({ success: false, message: "No such user! Please Sign up." });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.post("/verifyOTP", async (req, res) => {
  try {
    let { email, otp } = req.body;

    // Check if email or otp is missing
    if (!email || !otp) {
      throw new Error("Empty OTP or Email not allowed");
    }

    // Find OTP records associated with the email
    const UserOtpVerificationRecords = await UserOtpVerification.find({ email });

    // Check if no records were found or if OTP is already verified
    if (UserOtpVerificationRecords.length <= 0) {
      throw new Error("Account record does not exist or is already verified");
    } else {
      const { expiresAt } = UserOtpVerificationRecords[0];
      const hashedOTP = UserOtpVerificationRecords[0].otp;

      // Check if OTP has expired
      if (expiresAt < Date.now()) {
        // Delete expired OTP records
        await UserOtpVerification.deleteMany({ email });
        throw new Error("Code has expired, Please request again");
      } else {
        // Compare the entered OTP with the stored (hashed) OTP
        const validOtp = await bcrypt.compare(otp, hashedOTP);

        if (!validOtp) {
          throw new Error("Invalid code passed. Check your inbox");
        } else {
          // OTP is valid, update user as verified
          await UserModel.updateOne({ email }, { isVerified: true });

          // Delete the OTP verification record after successful verification
          await UserOtpVerification.deleteMany({ email });

          // Send success response
          res.json({
            status: "VERIFIED",
            message: "User email verified",
          });
        }
      }
    }
  } catch (error) {
    res.json({
      status: "FAILED",
      message: error.message,
    });
  }
});


app.listen(3002, () => {
  console.log("Server has started");
});
