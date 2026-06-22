import { useEffect } from "react";

export default function CandidateDrawer({
  candidate,
  onClose,
  onUpdateStatus,
}) {
  useEffect(() => {
    if (!candidate) return;

    const scrollPosition = window.scrollY;

    document.documentElement.classList.add("drawer-open");
    document.body.classList.add("drawer-open");
    document.body.style.top = `-${scrollPosition}px`;

    return () => {
      document.documentElement.classList.remove("drawer-open");
      document.body.classList.remove("drawer-open");
      document.body.style.top = "";
      window.scrollTo(0, scrollPosition);
    };
  }, [candidate]);

  if (!candidate) return null;

  return (
    <div className="drawer open">
      <span className="close" onClick={onClose}>
        ×
      </span>

      <div className="drawer-profile">
        <div className="big-avatar">
          {candidate.full_name
            ?.split(" ")
            .map((word) => word[0])
            .join("")
            .slice(0, 2)}
        </div>

        <h1>{candidate.full_name}</h1>
        <p>{candidate.email}</p>
      </div>

      <div className="details-grid-modal">
        <div className="detail-item">
          <h4>Application Number</h4>
          <p>{candidate.application_number}</p>
        </div>

        <div className="detail-item">
          <h4>Date Of Birth</h4>
          <p>{candidate.date_of_birth}</p>
        </div>

        <div className="detail-item">
          <h4>Attendance</h4>
          <p>{candidate.attendance}</p>
        </div>

        <div className="detail-item">
          <h4>Current Status</h4>
          <p>{candidate.application_status}</p>
        </div>

        <div className="detail-item">
          <h4>Primary Department</h4>
          <p>{candidate.primary_department}</p>
        </div>

        <div className="detail-item">
          <h4>Secondary Department</h4>
          <p>{candidate.secondary_department}</p>
        </div>

        <div className="detail-item detail-item--wide">
          <h4>Why MLSC?</h4>
          <p>{candidate.join_reason}</p>
        </div>

        <div className="detail-item detail-item--wide">
          <h4>Other Societies</h4>
          <p>{candidate.other_societies}</p>
        </div>

        <div className="detail-item detail-item--wide">
          <h4>Why Should We Recruit You?</h4>
          <p>{candidate.recruit_reason}</p>
        </div>
      </div>

      <div className="actions">
        <button
          className="accept"
          onClick={() => onUpdateStatus(candidate.id, "Shortlisted")}
        >
          Shortlist
        </button>

        <button
          className="reject"
          onClick={() => onUpdateStatus(candidate.id, "Rejected")}
        >
          Reject
        </button>
      </div>
    </div>
  );
}
