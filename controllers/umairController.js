

import User from "../models/User.js";
import argon2 from "argon2";
const mongoose = import('mongoose');


// Add a new user
export const addUser = async (req, res) => {
    try {
      const { name, email, password, phone, role, reportTo, experience } = req.body;
      const hashedPassword = await argon2.hash(password);
  
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        phone,
        role,
        reportTo,
        experience,
        isVerified: true, // Assuming new users are verified by default
      });
  
      await newUser.save();
      res.json({ success: true, user: newUser });
    } catch (error) {
      console.error("Error adding user:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };
  
  // Delete a user
  export const deleteUser = async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findByIdAndDelete(id);
  
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
  
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

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
  