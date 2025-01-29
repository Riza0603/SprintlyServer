import User from "../models/User.js";
import UserOtpVerification from "../models/UserOtpVerification.js";
import bcrypt from "bcrypt";
import transporter from "../config/emailTransporter.js";

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


