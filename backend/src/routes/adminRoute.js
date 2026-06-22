import express from "express";
import {
  getAllCandidates,
  updateCandidateStatus,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/candidates", getAllCandidates);

router.patch("/candidates/:id/status", updateCandidateStatus);

export default router;
