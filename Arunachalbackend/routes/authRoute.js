import express from "express";
import { protect, restrictTo } from "../utils/auth.js";
import { addUser, deleteUser, editUser, getMyProfile, getUsers, login, logout } from "../controller/authController.js";
import { decryptPayload } from "../middleware/decryptPayload.js";
const authRoute = express.Router();

// Auth endpoints accept either plain JSON or encryptedBody: { content, iv } (GCM or CBC); key from ENCRYPTION_KEY.

// Public routes (no authentication required)
authRoute.post("/signup", decryptPayload, addUser);
authRoute.post("/login", decryptPayload, login);
authRoute.post("/logout", logout);

// Protected routes (authentication required)
authRoute.get("/getMyProfile", protect, getMyProfile);
authRoute.put("/editUser/:userId", protect, decryptPayload, editUser);

// Admin only routes
authRoute.post("/addUser", protect, restrictTo("admin"), decryptPayload, addUser);
authRoute.get("/getUsers",protect,restrictTo("admin"), getUsers);
authRoute.delete("/deleteUser/:userId",protect,restrictTo("admin"),deleteUser);

export default authRoute;