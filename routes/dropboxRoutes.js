import express from "express";
import {
  redirectToDropbox,
  handleCallback,
  getCurrentConnection,
  listFiles,
  disconnect,
  viewFile,
  getThumbnail,
} from "../controllers/dropboxController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// OAuth Authorize Initiator (Redirects to Dropbox)
router.get("/auth/dropbox", redirectToDropbox);

// OAuth Callback Handler (Dropbox redirects here)
router.get("/auth/dropbox/callback", handleCallback);

// Retrieve connected status (Protected)
router.get("/api/dropbox/me", requireAuth, getCurrentConnection);

// List directory content (Protected)
router.get("/api/dropbox/files", requireAuth, listFiles);

// Resolve direct view url for a file (Protected)
router.get("/api/dropbox/view", requireAuth, viewFile);

// Stream image thumbnail preview (Protected)
router.get("/api/dropbox/thumbnail", requireAuth, getThumbnail);

// Disconnect/Unlink Dropbox account (Protected)
router.post("/api/dropbox/disconnect", requireAuth, disconnect);

export default router;
