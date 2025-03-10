import User from "../models/User.js";
import jwt from "jsonwebtoken";
import argon2 from "argon2";
import transporter from "../config/emailTransporter.js";
import UserOtpVerification from "../models/UserOtpVerification.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import TaskModel from "../models/Tasks.js";
import PendingUser from "../models/PendingUser.js";
import { sendEmail } from "../services/emailService.js";

//errorHandler
const handleErrors = (err, res) => {
  console.error("Error:", err.message, err.code);
  res.status(err.code === 11000 ? 400 : 500).json({
    success: false,
    message: err.message || "Internal server error",
    code: err.code,
  });
};

//login
export const login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    

    if (!user) {
      return res.json({ success: false, message: "No such user! Please Sign up." });
    }

    if (!user.isVerified) {
      return res.json({ success: false, message: "Your account is not verified. Please verify your email before logging in." });
    }

    const isValidPassword = await argon2.verify(user.password, req.body.password);
    console.log("Is valid password: ", isValidPassword);

    if (!isValidPassword) {
      return res.json({ success: false, message: "Invalid Password" });
    }

    // Generate JWT Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "8h" });

    res.json({
      success: true,
      message: "Login Successful!",
      user:user,
      token,
    });

  } catch (error) {
    handleErrors(error, res);
  }
};

// Registration (Store dateOfJoining in OTP table and PendingUser table)
export const signup = async (req, res) => {
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const { name, email, password, phone, dateOfJoining } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: "Email already exists." });

    const hashedPassword = await argon2.hash(password);
    const hashedOTP = await bcrypt.hash(verificationCode, 10);

    // Store in PendingUser Table
    await new PendingUser({ name, email, phone, password: hashedPassword, dateOfJoining }).save();

    // Store OTP for verification
    await new UserOtpVerification({
      email,
      otp: hashedOTP,
      expiresAt: Date.now() + 60000, 
    }).save();

    
    const emailSent = await sendEmail(email, "Verify Your Email - Sprintly", verificationCode, "verifyOTP");

    if (!emailSent) return res.status(500).json({ success: false, message: "Error sending OTP email." });

    res.json({ success: true, message: "OTP sent. Please verify your email." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify OTP (Move user from PendingUser to User table)
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const otpRecord = await UserOtpVerification.findOne({ email });
    if (!otpRecord) return res.status(400).json({ success: false, message: "No pending verification found." });

    if (otpRecord.expiresAt < Date.now()) {
      await UserOtpVerification.updateOne({ email }, { $unset: { otp: "" } });
      return res.status(400).json({ success: false, message: "OTP expired. Request a new one." });
    }    

    const validOtp = await bcrypt.compare(otp, otpRecord.otp);
    if (!validOtp) return res.status(400).json({ success: false, message: "Invalid OTP. Try again." });

    const pendingUser = await PendingUser.findOne({ email });
    if (!pendingUser) return res.status(400).json({ success: false, message: "User data not found." });

    const joiningDate = new Date(pendingUser.dateOfJoining);
    const experience = Math.floor((new Date() - joiningDate) / (1000 * 60 * 60 * 24 * 365));

    const newUser = await User.create({
      name: pendingUser.name,
      email: pendingUser.email,
      phone: pendingUser.phone,
      password: pendingUser.password,
      experience,
      isVerified: true,
    });

    await UserOtpVerification.deleteMany({ email });
    await PendingUser.deleteMany({ email });

    res.json({ success: true, message: "User verified and registered successfully.", user: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Resend OTP (Retrieve from PendingUser and send new OTP)
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required." });

    const pendingUser = await PendingUser.findOne({ email });
    if (!pendingUser) return res.status(400).json({ success: false, message: "No pending user found." });

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(newOtp, 10);

    await UserOtpVerification.updateOne(
      { email },
      { otp: hashedOtp, expiresAt: Date.now() + 60000 },
      { upsert: true }
    );

    const emailSent = await sendEmail(email, "Resend OTP - Sprintly", newOtp, "resendOTP");

    if (!emailSent) return res.status(500).json({ success: false, message: "Error sending OTP email." });

    res.json({ success: true, message: "OTP resent successfully. Check your email." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



//forgot password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    const token = jwt.sign({ id: user._id },process.env.JWT_SECRET, { expiresIn: "8h" });
    const resetLink = `http://localhost:5173/reset-password/${user._id}/${token}`;

    // Send Reset Email using email service
    const emailSent = await sendEmail(email, "Reset Your Password - Sprintly", resetLink, "resetPassword");

    if (!emailSent) return res.status(500).json({ success: false, message: "Error sending reset email." });

    res.json({ success: true, message: "Reset email sent." });
  } else {
    res.json({ success: false, message: "User not found." });
  }
};

//reset password
export const resetPassword = async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || decoded.id !== id) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const hashedPassword = await argon2.hash(password);

    await User.findByIdAndUpdate(id, { password: hashedPassword });

    res.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ success: false, message: "Failed to reset password. Token may have expired or is invalid." });
  }
};


//for profile
export const getUser = async (req, res) => {
  const { email } = req.params;
  const token = req.headers.authorization?.split(" ")[1]; // Extract Bearer token

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  try {

    const user = await User.findOne({ email }).select("name email phone experience role profilePicUrl reportTo adminAccess");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    handleErrors(error, res);
  }
};


//get the list of all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("name email experience role reportTo "); // Fetch all users
    res.json({ success: true, users });
  } catch (error) {
    handleErrors(error, res);
  }
};

//update the user details
export const updateUser = async (req, res) => {
  try {
    const { id, email, name, experience, role, reportTo } = req.body;

    const user = await User.findOneAndUpdate({ _id: id }, { name, email, experience, role, reportTo }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update username in comments where userId matches
    await TaskModel.updateMany({ "comments.userId": id }, { $set: { "comments.$[].username": name } });

    res.json({ success: true, user });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateUserProfilePic = async (req, res) => {
  const { email, profilePicUrl } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      { email: email },
      { profilePicUrl: profilePicUrl }, // Updating the profilePicUrl field
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "Profile picture updated successfully!", user });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ success: false, message: "Error updating profile picture" });
  }
};

//verify-token
export const verifyToken = async (req, res) => {
  const { id } = req.params;
  const { token } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || decoded.id !== id) {
      return res.status(400).json({ success: false, message: "Invalid or expired token." });
    }

    res.json({ success: true, message: "Valid token." });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(400).json({ success: false, message: "Invalid or expired token." });
  }
};

// export const getUsers = async (req, res) => {
//   try {
//     console.log("Fetching all users...");  // Debugging
//     const users = await User.find({}, "-password");  // Exclude passwords for security
//     res.status(200).json(users);
//   } catch (err) {
//     console.error("Error in getUsers:", err.message);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };



export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password");
    res.status(200).json(users);
  } catch (err) {
    console.error("Error in getUsers:", err.message);
    handleErrors(error, res);
  }
};

//fetchById
export const fetchById = async (req, res) => {
  try {
    const { memberIds } = req.body;
    const members = await User.find({ '_id': { $in: memberIds } });
    res.json(members);
  } catch (error) {
    handleErrors(error, res);
  }
};


