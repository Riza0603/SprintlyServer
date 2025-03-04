import mongoose from "mongoose";
const Schema = mongoose.Schema;

const UserOtpVerificationSchema = new Schema({
  email: String,
  name: String,
  phone: String,
  password: String, 
  dateOfJoining: String,
  otp: String,
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date,
});

const UserOtpVerification = mongoose.model("UserOtpVerification", UserOtpVerificationSchema);

export default UserOtpVerification;
