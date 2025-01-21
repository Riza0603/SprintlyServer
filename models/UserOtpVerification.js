import mongoose from "mongoose";

const Schema = mongoose.Schema;

const UserOtpVerificationSchema = new Schema({
  userId: String,
  otp: String,
  createdAt: Date,
  expiresAt: Date,
});

const UserOtpVerification = mongoose.model(
  "UserOtpVerification",
  UserOtpVerificationSchema
);

export default UserOtpVerification;
