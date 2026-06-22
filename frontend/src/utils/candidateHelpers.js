export function upsertCandidate(candidates, incomingCandidate) {
  const existingIndex = candidates.findIndex(
    (candidate) => candidate.id === incomingCandidate.id,
  );

  if (existingIndex === -1) {
    return [incomingCandidate, ...candidates];
  }

  return candidates.map((candidate) =>
    candidate.id === incomingCandidate.id ? incomingCandidate : candidate,
  );
}

export function calculateStats(candidates) {
  return {
    total: candidates.length,

    pending: candidates.filter(
      (candidate) => candidate.application_status === "Pending",
    ).length,

    shortlisted: candidates.filter(
      (candidate) => candidate.application_status === "Shortlisted",
    ).length,

    rejected: candidates.filter(
      (candidate) => candidate.application_status === "Rejected",
    ).length,
  };
}
