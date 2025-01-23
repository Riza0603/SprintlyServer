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
    user: "technologiesganglia@gmail.com",
    pass: "cgao azbd ffdq vbcz",
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
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const { name, email, } = req.body;

  try {
    // Hash OTP using bcrypt
    const saltRounds = 10;
    const hashedOTP = await bcrypt.hash(verificationCode, saltRounds);
    console.log("Hashed OTP: ", hashedOTP);

    // Create the user and get the user ID
    const newUser = await UserModel.create(req.body);

    // Save the OTP with the user ID in the UserOtpVerification model
    const newUserOtp = new UserOtp({
      userId: newUser._id,
      email, // Add this field
      otp: hashedOTP,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    });
    

    await newUserOtp.save();
    console.log("OTP saved in UserOtpVerification model");

    // Send OTP email to the user
    // Send OTP email to the user
var mailOptions = {
  from: "Sprintly",
  to: email,
  subject: "Verify Your Email",
  html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4; border-radius: 8px; border: 1px solid #ddd;">
      <h2 style="color: #333; text-align: center;">Welcome to Sprintly!</h2>
      <p style="color: #555; font-size: 16px;">
        Thank you for signing up. Please use the following OTP to verify your email address:
      </p>
      <p style="text-align: center; font-size: 24px; font-weight: bold; color: #4CAF50; margin: 20px 0;">
        ${verificationCode}
      </p>
      <p style="color: #555; font-size: 14px;">
        This OTP is valid for only a limited time. If you did not request this, please ignore this email.
      </p>
      <footer style="margin-top: 20px; text-align: center; font-size: 12px; color: #888;">
        <p>Need help? <a href="mailto:technologiesganglia@gmail.com" style="color: #4CAF50; text-decoration: none;">Contact Support</a></p>
        <p>&copy; ${new Date().getFullYear()} Sprintly. All rights reserved.</p>
      </footer>
    </div>
  `,
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

    // Find OTP record associated with the email
    const UserOtpVerificationRecord = await UserOtpVerification.findOne({ email });

    // Check if no record was found or if OTP is already verified
    if (!UserOtpVerificationRecord) {
      throw new Error("Account record does not exist or is already verified");
    } else {
      const { expiresAt, otp: hashedOTP } = UserOtpVerificationRecord;

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
