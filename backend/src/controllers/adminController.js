import {
  fetchAllCandidates,
  updateStatus,
  markQuizAttendance,
  getAttendanceStatsService,
} from "../services/adminService.js";

export async function getAllCandidates(req, res) {
  try {
    const data = await fetchAllCandidates();

    return res.json(data);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: error.message || "Failed to fetch candidates",
    });
  }
}

export async function updateCandidateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const data = await updateStatus(id, status);
    req.app.get("io")?.emit("candidate:updated", data);

    return res.json({
      message: "Status updated",
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: error.message || "Failed to update status",
    });
  }
}

export async function markCandidateAttendance(req, res) {
  try {
    const { qrToken } = req.body;

    const result = await markQuizAttendance(qrToken);

    req.app.get("io")?.emit("candidate:updated", result.candidate);

    return res.json(result);
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      message: error.message || "Failed to mark attendance",
    });
  }
}

export async function getAttendanceStats(req, res) {
  try {
    const stats = await getAttendanceStatsService();

    return res.json(stats);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to load attendance stats",
    });
  }
}
