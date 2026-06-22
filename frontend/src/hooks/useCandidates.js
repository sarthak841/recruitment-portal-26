import { useEffect, useState } from "react";
import { getCandidates, updateCandidateStatus } from "../lib/api";

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

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    function handleCandidateChange(candidate) {
      setCandidates((current) => upsertCandidate(current, candidate));
    }

    adminSocket.on("candidate:submitted", handleCandidateChange);

    adminSocket.on("candidate:updated", handleCandidateChange);

    adminSocket.connect();

    return () => {
      adminSocket.off("candidate:submitted", handleCandidateChange);

      adminSocket.off("candidate:updated", handleCandidateChange);

      adminSocket.disconnect();
    };
  }, []);

  return {
    candidates,
    loading,
    fetchCandidates,
    updateStatus,
  };
}
