import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { getUserProfile, updateUserProfile, uploadAvatar } from "../controllers/userController.js";

const router = express.Router();

// Fetch active user profile (Protected)
router.get("/profile", requireAuth, getUserProfile);

// Update user profile fields (Protected)
router.post("/profile", requireAuth, updateUserProfile);

// Upload profile avatar base64 (Protected)
router.post("/avatar", requireAuth, uploadAvatar);

export default router;
