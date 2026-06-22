import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getDashboard } from "../lib/api";

export default function Dashboard() {
  const location = useLocation();
  const [content, setContent] = useState("Loading dashboard...");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || "",
  );

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        setContent(await getDashboard(controller.signal));
      } catch (requestError) {
        if (requestError.name === "AbortError") {
          return;
        }

        setError(requestError.message || "Failed to load dashboard.");
      }
    }

    loadDashboard();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <main className="dashboard-page">
      {successMessage ? (
        <div className="success-toast" role="status">
          <span className="success-toast__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="m7.5 12.5 3 3 6-7" />
            </svg>
          </span>
          <span className="success-toast__content">
            <strong>Details saved</strong>
            <span>{successMessage}</span>
          </span>
          <button
            className="success-toast__close"
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setSuccessMessage("")}
          >
            ×
          </button>
          <span className="success-toast__progress" aria-hidden="true" />
        </div>
      ) : null}
      {error ? <p>{error}</p> : <p>{content}</p>}
    </main>
  );
}
