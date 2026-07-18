import express from "express";
import {
  getChatHistory,
  sendChatMessage,
  generateSectionContent
} from "../controllers/chatController.js";
import { validateChatMessage } from "../middleware/validator.js";

const router = express.Router();

// Base routes for /api/chat
router.route("/")
  .get(getChatHistory)
  .post(validateChatMessage, sendChatMessage);

// Generate section details proxy endpoint
router.post("/generate-section", generateSectionContent);

export default router;
