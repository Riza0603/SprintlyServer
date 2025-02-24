import User from "../models/User.js";
import jwt from "jsonwebtoken";
import argon2 from "argon2";
import transporter from "../config/emailTransporter.js";
import UserOtpVerification from "../models/UserOtpVerification.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import UserModel from "../models/User.js";
import TaskModel from "../models/Tasks.js";

//errorHandler
const handleErrors = (err, res) => {
  console.error("Error:", err.message, err.code);
  if (err.code === 11000) {
    return res.status(400).json({ success: false, message: "Record already exists." });
  }

  res.status(500).json({ success: false, message: err.message || "Internal server error", code: err.code });
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
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({
      success: true,
      message: "Login Successful!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        experience: user.experience,
        reportTo: user.reportTo,
      },
      token,
    });

  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};



//forgot password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    const token = jwt.sign({ id: user._id }, "jwt_secret_key", { expiresIn: "1h" });

    const mailOptions = {
      from: "Sprintly",
      to: email,
      subject: "Reset Your Password - Sprintly",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4; text-align: center;">
          <div style="max-width: 500px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333;">Reset Your Password</h2>
            <p style="color: #555; font-size: 16px;">
              We received a request to reset your password. Click the button below to proceed:
            </p>
            <a href="http://localhost:5173/reset-password/${user._id}/${token}"
              style="display: inline-block; padding: 15px 25px; font-size: 16px; font-weight: bold; color: #fff; background: #4CAF50; border-radius: 8px; text-decoration: none; margin: 20px 0;">
              Reset Password
            </a>
            <p style="color: #555; font-size: 14px;">
              If you did not request a password reset, please ignore this email.
            </p>
            <footer style="margin-top: 20px; font-size: 12px; color: #888;">
              <p>Need help? <a href="mailto:sprintlyganglia@gmail.com" style="color: #4CAF50; text-decoration: none;">Contact Support</a></p>
              <p>&copy; ${new Date().getFullYear()} Sprintly. All rights reserved.</p>
            </footer>
          </div>
        </div>
      `,
    };
    

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) return res.status(500).json({ success: false, message: "Error sending reset email." });
      res.json({ success: true, message: "Reset email sent." });
    });
  } else {
    res.json({ success: false, message: "User not found." });
  }
};


//reset password
export const resetPassword = async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  try {
    console.log("Verifying token...");
    const decoded = jwt.verify(token, "jwt_secret_key");

    if (!decoded || decoded.id !== id) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token." });
    }

    console.log("Token verified. Checking user...");
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    console.log("User found. Hashing new password...");
    const hashedPassword = await argon2.hash(password);

    console.log("Updating user password...");
    await User.findByIdAndUpdate(id, { password: hashedPassword });

    res.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ success: false, message: "Failed to reset password. Token may have expired or is invalid." });
  }
};



//regisration
export const signup = async (req, res) => {
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const { name, email, password, phone } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: "Email already exists." });

    const hashedOTP = await bcrypt.hash(verificationCode, 10);
    const newUser = await User.create({ name, email, password,phone });

    await new UserOtpVerification({ userId: newUser._id, email, otp: hashedOTP, expiresAt: Date.now() + 60000}).save();

    const mailOptions = {
      from: "Sprintly",
      to: email,
      subject: "Verify Your Email - Sprintly",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4; text-align: center;">
          <div style="max-width: 500px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333;">Welcome to <span style="color: #4CAF50;">Sprintly</span>!</h2>
            <p style="color: #555; font-size: 16px;">
              Thank you for signing up! Use the OTP below to verify your email:
            </p>
            <div style="display: inline-block; padding: 15px 25px; font-size: 24px; font-weight: bold; color: #fff; background: #4CAF50; border-radius: 8px; margin: 20px 0;">
              ${verificationCode}
            </div>
            <p style="color: #555; font-size: 14px;">
              This OTP is valid for a limited time. If you did not request this, please ignore this email.
            </p>
            <a href="mailto:sprintlyganglia@gmail.com" style="display: inline-block; margin-top: 15px; color: #4CAF50; font-size: 14px; text-decoration: none;">
              Need help? Contact Support
            </a>
            <footer style="margin-top: 20px; font-size: 12px; color: #888;">
              <p>&copy; ${new Date().getFullYear()} Sprintly. All rights reserved.</p>
            </footer>
          </div>
        </div>
      `,
    };
    

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) return res.status(500).json({ success: false, message: "Error sending OTP email." });
      res.json({ success: true, message: "User created and email sent." });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating user." });
  }
};

//verify that the OTP is correct
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const otpRecord = await UserOtpVerification.findOne({ email });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Account record does not exist or is already verified" });
    }

    // Check if the OTP has expired
    if (otpRecord.expiresAt < Date.now()) {
      await UserOtpVerification.deleteMany({ email });  
      return res.status(400).json({ success: false, message: "Code has expired, please request again." });
    }

    // Compare entered OTP with the hashed OTP stored in the database
    const validOtp = await bcrypt.compare(otp, otpRecord.otp);
    if (!validOtp) {
      return res.status(400).json({ success: false, message: "Invalid OTP, check your inbox." });
    }

    // Mark user as verified and clean up OTP record
    await User.updateOne({ email }, { isVerified: true });
    await UserOtpVerification.deleteMany({ email });

    res.json({ success: true, message: "User email verified" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


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
    
    const user = await User.findOne({ email }).select("name email phone experience role reportTo");

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
    const users = await User.find().select("name email experience role reportTo"); // Fetch all users
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching users", error });
  }
};

//update the user details
export const updateUser = async (req, res) => {
  try{
    const { id,email, name, experience, role, reportTo} = req.body;
    
    const user = await User.findOneAndUpdate({ _id:id }, { name, email,experience, role, reportTo }, { new: true });
    if(!user){
      return res.status(404).json({ success: false, message: "User not found" });
    }

// Update username in comments where userId matches
await TaskModel.updateMany({ "comments.userId": id }, { $set: { "comments.$[].username": name } });

    res.json({ success: true, user });
  }catch(error){
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
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



export const getUsers = async (req, res) => {
  try {
    
    const users = await User.find({}, "-password");  
    res.status(200).json(users);
  } catch (err) {
    console.error("Error in getUsers:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//fetchById
export const fetchById = async (req, res) => {
  try {
    const { memberIds } = req.body;
    const members = await User.find({ '_id': { $in: memberIds } });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required." });

    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found for email:", email);
      return res.status(404).json({ success: false, message: "User not found." });
    }
    // Generate OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    //console.log("Generated OTP:", newOtp);

    const hashedOtp = await bcrypt.hash(newOtp, 10);
    //console.log("Hashed OTP:", hashedOtp);

    // Delete any previous OTP records for this user
    try {
      await UserOtpVerification.deleteMany({ email });
      //console.log("Old OTP records deleted for:", email);
    } catch (err) {
      console.error("Error deleting previous OTPs:", err);
    }

    // Save new OTP
    const otpRecord = new UserOtpVerification({
      userId: user._id,
      email,
      otp: hashedOtp,
      expiresAt: Date.now() + 240000, 
    });

    await otpRecord.save();
    
    // Email options
    const mailOptions = {
      from: "Sprintly",
      to: email,
      subject: "Resend OTP - Sprintly",
      html: `<p>Your OTP: <strong>${newOtp}</strong></p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Email sending error:", error);
        return res.status(500).json({ success: false, message: "Error sending OTP email." });
      }
      console.log("OTP email sent:", info.response);
      res.json({ success: true, message: "OTP resent successfully. Check your email." });
    });

  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

