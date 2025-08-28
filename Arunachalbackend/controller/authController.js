import User from "../models/userModel.js";
import { generateToken } from "../utils/auth.js";
import bcrypt from "bcryptjs";


const addUser = async (req, res) => {
    try {
        const { name, email, password,confirmPassword } = req.body;
        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
            }
       
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({ name, email, password:hashedPassword });
        await user.save();
        res.status(201).json({ message: "User added successfully" });
    } catch (error) {
        console.error("Something went wrong",error.message);
        res.status(500).json({ message: "Server error" });
    }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password", 
      });
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password); // comparePassword must be defined in schema
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password",
      });
    }
    const expiresAt = new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    );


    const token = generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, 
      sameSite: "strict", 
    });
    await user.save();

    // Prepare user data response
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        user: userData,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const logout = async (req, res) => {
 try {
   
    const token = req.cookies?.token || 
                 (req.headers.authorization?.startsWith("Bearer") 
                  ? req.headers.authorization.split(" ")[1] 
                  : null);

 
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/", 
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};
const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const editUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, password, confirmPassword, role } = req.body;
    const currentUser = req.user; // From auth middleware

    // Find the user to be edited
    const userToEdit = await User.findById(userId);
    if (!userToEdit) {
      return res.status(404).json({ message: "User not found" });
    }

    // Role-based editing permissions
    // Admin can edit any user, including role changes
    // Regular users can only edit their own profile (except role)
    if (currentUser.role !== "admin" && currentUser._id.toString() !== userId) {
      return res.status(403).json({ message: "You can only edit your own profile" });
    }

    // Regular users cannot change their role
    if (currentUser.role !== "admin" && role && role !== userToEdit.role) {
      return res.status(403).json({ message: "You cannot change your role" });
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== userToEdit.email) {
      const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Update user data
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.trim().toLowerCase();
    if (role && currentUser.role === "admin") updateData.role = role;

    // Handle password update
    if (password) {
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const currentUser = req.user;
    
    // Return only the current user's profile (without password)
    const userProfile = await User.findById(currentUser._id).select('-password');
    
    res.status(200).json({
      success: true,
      user: userProfile
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export { addUser, login, logout, getUsers, deleteUser, editUser, getMyProfile };



