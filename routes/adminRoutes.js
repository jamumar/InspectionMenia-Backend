import express from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  getUsers,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser,
  getPasswordRequests,
  resolvePasswordRequest
} from "../controllers/adminController.js";

const router = express.Router();

// Apply auth + admin check globally to these endpoints
router.use(requireAuth);
router.use(requireAdmin);

// Accounts management routes
router.get("/users", getUsers);
router.post("/users", createUser);
router.put("/users/:uid", updateUser);
router.put("/users/:uid/password", updateUserPassword);
router.delete("/users/:uid", deleteUser);

// Password requests management routes
router.get("/password-requests", getPasswordRequests);
router.post("/password-requests/resolve", resolvePasswordRequest);

export default router;
