import { useMemo, useState, useEffect } from "react";
import "./AdminDashboard.css";

import CandidateCard from "../components/CandidateCard";
import CandidateDrawer from "../components/CandidateDrawer";
import StatsGrid from "../components/StatsGrid";
import AttendanceScanner from "../components/AttendanceScanner";

import { useCandidates } from "../hooks/useCandidates";
import { useCandidateFilters } from "../hooks/useCandidateFilters";

import { calculateStats } from "../utils/candidateHelpers";

export default function AdminDashboard() {
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const { candidates, loading, fetchCandidates, updateStatus } =
    useCandidates();

  const [showScanner, setShowScanner] = useState(false);
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    filteredCandidates,
  } = useCandidateFilters(candidates);

  const stats = useMemo(() => calculateStats(candidates), [candidates]);

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin") === "true";

    if (!isAdmin) {
      alert("Unauthorized Access");
      window.location.reload();
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("isAdmin");
    window.location.reload();
  };

  return (
    <div className="dashboard">
      <div className="header">
        <div>
          <h1>MLSC Recruitment Dashboard</h1>
          <p>Manage Recruitment Applications</p>
        </div>

        <div className="header-controls">
          <input
            type="text"
            placeholder="Search candidates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            onClick={() => setShowScanner(true)}
            style={{ width: "auto" }}
          >
            Scanner
          </button>

          <button onClick={fetchCandidates} style={{ width: "auto" }}>
            Refresh
          </button>

          <button onClick={logout} style={{ width: "auto" }}>
            Logout
          </button>
        </div>
      </div>

      <StatsGrid
        stats={stats}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {loading ? (
        <h2>Loading Candidates...</h2>
      ) : (
        <div className="cards-container">
          {filteredCandidates.length ? (
            filteredCandidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onSelect={setSelectedCandidate}
              />
            ))
          ) : (
            <p className="empty-candidates">
              No candidates match the selected filters.
            </p>
          )}
        </div>
      )}

      <CandidateDrawer
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onUpdateStatus={async (id, status) => {
          const updatedCandidate = await updateStatus(id, status);

          if (updatedCandidate) {
            setSelectedCandidate(updatedCandidate);
          }
        }}
      />

      {showScanner && (
        <AttendanceScanner onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
}
