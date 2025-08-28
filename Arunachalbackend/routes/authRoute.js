import express from "express";
import { protect, restrictTo } from "../utils/auth.js";
import { addUser, deleteUser, editUser, getMyProfile, getUsers, login, logout } from "../controller/authController.js";
const authRoute = express.Router();

// Public routes (no authentication required)
authRoute.post("/signup", addUser);
authRoute.post("/login", login);
authRoute.post("/logout", logout);

// Protected routes (authentication required)
authRoute.get("/getMyProfile", protect, getMyProfile);
authRoute.put("/editUser/:userId", protect, editUser);

// Admin only routes
authRoute.post("/addUser",protect,restrictTo("admin"),addUser);
authRoute.get("/getUsers",protect,restrictTo("admin"), getUsers);
authRoute.delete("/deleteUser/:userId",protect,restrictTo("admin"),deleteUser);

export default authRoute;