import { useMemo, useState } from "react";

export function useCandidateFilters(candidates) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredCandidates = useMemo(
    () =>
      candidates.filter((candidate) => {
        const matchesSearch = `${candidate.full_name}
          ${candidate.email}
          ${candidate.application_number}`
          .toLowerCase()
          .includes(search.toLowerCase());

        const matchesStatus =
          statusFilter === "All" ||
          candidate.application_status === statusFilter;

        return matchesSearch && matchesStatus;
      }),
    [candidates, search, statusFilter],
  );

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    filteredCandidates,
  };
}
