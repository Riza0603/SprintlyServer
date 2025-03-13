import User from "../models/User.js";

export const addUser = async (req, res) => {
  console.log("Data received from client:", req.body);
  try {
    const { name, email, phone, role, reportTo, experience } = req.body;

    const newUser = new User({
      name,
      email,
      phone,
      role,
      reportTo,
      experience,
      isVerified: true,
    });

    await newUser.save();
    res.json({ success: true, user: newUser });
  } catch (error) {
    console.error("Error adding user:", error);
    if (error.name === 'ValidationError') {
      res.status(400).json({ success: false, message: "Validation error", details: error.message });
    } else {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
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

// Update a user
export const updateUser = async (req, res) => {
  try {
    const { _id, name, email, role, experience, reportTo, projects } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { name, email, role, experience, reportTo, projects },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Fetch all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("name email experience role reportTo projects");
    console.log("Fetched users:", users); // Log the fetched users
    res.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error); // Log the error
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
