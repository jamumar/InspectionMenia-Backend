import express from "express";
import {
  getReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
  updateReportSection
} from "../controllers/reportController.js";
import { validateReport } from "../middleware/validator.js";

const router = express.Router();

// Base routes for /api/reports
router.route("/")
  .get(getReports)
  .post(validateReport, createReport);

router.route("/:id")
  .get(getReportById)
  .put(updateReport)
  .delete(deleteReport);

// Update specific section
router.put("/:id/sections/:sectionId", updateReportSection);

export default router;
