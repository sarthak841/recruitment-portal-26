import { fetchAllCandidates, updateStatus } from "../services/adminService.js";

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
