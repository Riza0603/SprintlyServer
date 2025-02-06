import User from "../models/User.js";
import jwt from "jsonwebtoken";
import argon2 from "argon2";
import transporter from "../config/emailTransporter.js";
import UserOtpVerification from "../models/UserOtpVerification.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

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
    if (user) {
      const isValidPassword = await argon2.verify(user.password, req.body.password);
      console.log("Is valid password: ", isValidPassword); // Debugging log for password verification

      if (isValidPassword) {
        // Generate JWT Token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({
          success: true,
          message: "Login Successful!",
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            experience: user.experience,
            reportTo: user.reportTo
          },
          token
        });
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
// 
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
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: "Email already exists." });

    const hashedOTP = await bcrypt.hash(verificationCode, 10);
    const newUser = await User.create({ name, email, password });

    await new UserOtpVerification({ userId: newUser._id, email, otp: hashedOTP, expiresAt: Date.now() + 3600000 }).save();

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

export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const otpRecord = await UserOtpVerification.findOne({ email });

    if (!otpRecord) {
      throw new Error("Account record does not exist or is already verified");
    }

    // Check if the OTP has expired
    if (otpRecord.expiresAt < Date.now()) {
      await UserOtpVerification.deleteMany({ email });
      throw new Error("Code has expired, please request again.");
    }

    // Compare entered OTP with the hashed OTP stored in the database
    const validOtp = await bcrypt.compare(otp, otpRecord.otp);  // Use bcrypt to compare the OTP
    if (!validOtp) {
      throw new Error("Invalid OTP, check your inbox.");
    }

    // Mark user as verified and clean up OTP record
    await User.updateOne({ email }, { isVerified: true });
    await UserOtpVerification.deleteMany({ email });

    res.json({ success: true, message: "User email verified" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getUser = async (req, res) => {
  console.log("Received request for user:", req.params.email);

  const { email } = req.params;
  const token = req.headers.authorization?.split(" ")[1]; // Extract Bearer token
  console.log("Token:", token);

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token verified:", decoded);
  } catch (err) {
    console.log("Invalid token");
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  try {
    const user = await User.findOne({ email }).select("name email experience role reportTo"); // Explicitly select fields

    if (!user) {
      console.log("User not found:", email);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log("User found:", JSON.stringify(user, null, 2)); // Better logging
    res.json({ success: true, user });
  } catch (error) {
    handleErrors(error, res); // Pass error to the error handler
  }
};


export const updateUser = async (req, res) => {
  try{
    const { email, name, experience, role, reportTo } = req.body;
    const user = await User.findOneAndUpdate({ email }, { name, experience, role, reportTo }, { new: true });
    if(!user){
      return res.status(404).json({ success: false, message: "User not found" });
    }
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

//resetToken Generation
// export const getResetToken = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const user = await User.findById(id);
//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found." });
//     }

//     // Generate token
//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });

//     res.json({ success: true, token });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

