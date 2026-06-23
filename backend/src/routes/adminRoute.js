import express from "express";
import {
  getAllCandidates,
  updateCandidateStatus,
  markCandidateAttendance,
  getAttendanceStats,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/candidates", getAllCandidates);

router.patch("/candidates/:id/status", updateCandidateStatus);

router.post("/attendance", markCandidateAttendance);
router.get("/attendance/stats", getAttendanceStats);

export default router;
