export default function CandidateCard({ candidate, onSelect }) {
  return (
    <div className="applicant-card" onClick={() => onSelect(candidate)}>
      <div className="profile">
        <div className="avatar">
          {candidate.full_name
            ?.split(" ")
            .map((word) => word[0])
            .join("")
            .slice(0, 2)}
        </div>

        <div>
          <h2>{candidate.full_name}</h2>
          <p>{candidate.email}</p>
        </div>
      </div>

      <div className="tags">
        <span className="tag technical">{candidate.primary_department}</span>

        <span
          className={`status ${candidate.application_status?.toLowerCase()}`}
        >
          {candidate.application_status}
        </span>
      </div>

      <div className="info">
        <p>App No: {candidate.application_number}</p>
        <p>Primary: {candidate.primary_department}</p>
      </div>

      <button>View Application</button>
    </div>
  );
}
