export default function StatsGrid({ stats, statusFilter, setStatusFilter }) {
  return (
    <div className="stats-grid">
      {[
        ["All", "Total", stats.total],
        ["Pending", "Pending", stats.pending],
        ["Shortlisted", "Shortlisted", stats.shortlisted],
        ["Rejected", "Rejected", stats.rejected],
      ].map(([value, title, count]) => (
        <div
          key={value}
          className={`stat-card ${statusFilter === value ? "active" : ""}`}
          onClick={() => setStatusFilter(value)}
        >
          <h3>{title}</h3>
          <p>{count}</p>
        </div>
      ))}
    </div>
  );
}
