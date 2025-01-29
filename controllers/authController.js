import User from "../models/User.js";
import jwt from "jsonwebtoken";
import argon2 from "argon2";
import transporter from "../config/emailTransporter.js";

export const login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const isValidPassword = await argon2.verify(user.password, req.body.password);
      if (isValidPassword) {
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
};

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

