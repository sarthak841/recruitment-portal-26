import { useEffect, useState } from "react";
import {
  getCandidates,
  updateCandidateStatus,
  updateCandidateAttendance,
  deleteCandidate,
  lockCandidateForm,
} from "../lib/api";

import { adminSocket } from "../lib/socket";
import { upsertCandidate } from "../utils/candidateHelpers";

export function useCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchCandidates() {
    try {
      setLoading(true);
      const data = await getCandidates();
      setCandidates(data);
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to load candidates.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      const response = await updateCandidateStatus(id, status);
      const updatedCandidate = response.data;
      setCandidates((current) => upsertCandidate(current, updatedCandidate));
      return updatedCandidate;
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to update status.");
      return null;
    }
  }

  async function updateAttendance(id, present) {
    try {
      const response = await updateCandidateAttendance(id, present);
      const updatedCandidate = response.data;
      setCandidates((current) => upsertCandidate(current, updatedCandidate));
      return updatedCandidate;
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to update attendance.");
      return null;
    }
  }

  async function removeCandidate(id) {
    try {
      await deleteCandidate(id);
      setCandidates((current) => current.filter((c) => c.id !== id));
      return true;
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to delete candidate.");
      return false;
    }
  }

  async function toggleLock(id, locked) {
    try {
      const response = await lockCandidateForm(id, locked);
      const updatedCandidate = response.data;
      setCandidates((current) => upsertCandidate(current, updatedCandidate));
      return updatedCandidate;
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to update form lock.");
      return null;
    }
  }

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    function handleCandidateChange(candidate) {
      setCandidates((current) => upsertCandidate(current, candidate));
    }

    function handleCandidateDeleted({ id }) {
      setCandidates((current) => current.filter((c) => c.id !== id));
    }

    adminSocket.on("candidate:submitted", handleCandidateChange);
    adminSocket.on("candidate:updated", handleCandidateChange);
    adminSocket.on("candidate:deleted", handleCandidateDeleted);
    adminSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });
    adminSocket.connect();

    return () => {
      adminSocket.off("candidate:submitted", handleCandidateChange);
      adminSocket.off("candidate:updated", handleCandidateChange);
      adminSocket.off("candidate:deleted", handleCandidateDeleted);
      adminSocket.disconnect();
    };
  }, []);

  return {
    candidates,
    loading,
    fetchCandidates,
    updateStatus,
    updateAttendance,
    removeCandidate,
    toggleLock,
  };
}
