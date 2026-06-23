import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { markAttendance, getAttendanceStats } from "../lib/api";

export default function AttendanceScanner({ onClose }) {
  const scannerRef = useRef(null);

  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeoutRef = useRef(null);
  const lastScanRef = useRef("");

  const successSoundRef = useRef(new Audio("/sounds/success.mp3"));
  const errorSoundRef = useRef(new Audio("/sounds/error.mp3"));

  const [result, setResult] = useState({
    type: "idle",
    title: "Ready",
    message: "Start the camera to scan candidate QR codes.",
  });

  const [toasts, setToasts] = useState([]);

  const [totalCandidates, setTotalCandidates] = useState(0);
  const [presentCandidates, setPresentCandidates] = useState(0);
  const remainingCandidates = totalCandidates - presentCandidates;
  const percentage = totalCandidates
    ? Math.round((presentCandidates / totalCandidates) * 100)
    : 0;

  const [history, setHistory] = useState([]);

  function addToast(type, message) {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }

  function dismissToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  useEffect(() => {
    async function loadStats() {
      try {
        const stats = await getAttendanceStats();
        setTotalCandidates(stats.totalCandidates);
        setPresentCandidates(stats.presentCandidates);
      } catch (error) {
        console.error(error);
      }
    }
    loadStats();
  }, []);

  useEffect(() => {
    startScanner();
  }, []);

  useEffect(() => {
    successSoundRef.current.load();
    errorSoundRef.current.load();
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  async function startScanner() {
    if (isScanning) return;

    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.floor(minEdge * 0.7);
            return { width: size, height: size };
          },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        (decodedText) => {
          handleScan(decodedText);
        },
      );

      setIsScanning(true);
    } catch (error) {
      setResult({
        type: "error",
        title: "Camera Error",
        message: error.message,
      });
    }
  }

  async function stopScanner() {
    if (!scannerRef.current || !isScanning) return;

    try {
      await scannerRef.current.stop();
      await scannerRef.current.clear();
    } catch (error) {
      console.error(error);
    }

    setIsScanning(false);
  }

  async function handleScan(decodedText) {
    if (isSubmitting) return;
    if (decodedText === lastScanRef.current) return;

    lastScanRef.current = decodedText;

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      lastScanRef.current = "";
    }, 3000);

    setIsSubmitting(true);

    try {
      const response = await markAttendance(decodedText);
      const { candidate, alreadyPresent } = response;

      if (alreadyPresent) {
        errorSoundRef.current.currentTime = 0;
        errorSoundRef.current.play().catch(() => {});

        setResult({
          type: "warning",
          title: "Already Present",
          message: `${candidate.full_name} was already marked present.`,
        });

        addToast("warning", `${candidate.full_name} is already checked in.`);
        addHistory("Already Present", candidate.full_name);
      } else {
        successSoundRef.current.currentTime = 0;
        successSoundRef.current.play().catch(() => {});
        setPresentCandidates((count) => count + 1);
        navigator.vibrate?.(200);

        setResult({
          type: "success",
          title: "Attendance Marked",
          message: `${candidate.full_name} marked present.`,
        });

        addToast("success", `Marked ${candidate.full_name} present ✓`);
        addHistory("Present", candidate.full_name);
      }
    } catch (error) {
      errorSoundRef.current.currentTime = 0;
      errorSoundRef.current.play().catch(() => {});

      const msg = error.message || "Attendance update failed.";
      const isInvalidQr =
        msg.toLowerCase().includes("not found") ||
        msg.toLowerCase().includes("invalid") ||
        msg.toLowerCase().includes("unrecognized");

      setResult({
        type: "error",
        title: "Failed",
        message: msg,
      });

      addToast(
        "error",
        isInvalidQr
          ? "Invalid QR code — not a registered candidate."
          : `Error: ${msg}`,
      );

      addHistory("Failed", decodedText);
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);
    }
  }

  function addHistory(status, value) {
    setHistory((current) =>
      [
        {
          status,
          value,
          time: new Date().toLocaleTimeString(),
        },
        ...current,
      ].slice(0, 10),
    );
  }

  async function handleClose() {
    if (isScanning) await stopScanner();
    onClose();
  }

  return (
    <div className="scanner-overlay">
      {/* Toast stack */}
      <div className="toast-stack">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast--${toast.type}`}
            onClick={() => dismissToast(toast.id)}
          >
            <span className="toast-icon">
              {toast.type === "success" && "✓"}
              {toast.type === "warning" && "⚠"}
              {toast.type === "error" && "✕"}
            </span>
            <span className="toast-message">{toast.message}</span>
          </div>
        ))}
      </div>

      <div className="scanner-modal">
        <button
          className="scanner-close"
          onClick={handleClose}
          aria-label="Close Scanner"
        >
          ×
        </button>

        <div className="scanner-main">
          <h2>Attendance Scanner</h2>

          <div id="qr-reader" />

          <div className="scanner-actions">
            <button onClick={startScanner} disabled={isScanning}>
              Start Camera
            </button>

            <button onClick={stopScanner} disabled={!isScanning}>
              Stop Camera
            </button>
          </div>
        </div>

        <div className="scanner-sidebar">
          <div className="scanner-stats">
            <div>
              <strong>{totalCandidates}</strong>
              <span>Total</span>
            </div>

            <div>
              <strong>{presentCandidates}</strong>
              <span>Present</span>
            </div>

            <div>
              <strong>{remainingCandidates}</strong>
              <span>Remaining</span>
            </div>
          </div>

          <div className="attendance-progress">
            <div
              className="attendance-progress-fill"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <p className="attendance-percentage">
            {presentCandidates} of {totalCandidates} checked in
          </p>

          <div className={`scanner-result ${result.type}`}>
            <h3>{result.title}</h3>
            <p>{result.message}</p>
          </div>

          <div className="scanner-history">
            <h3>Recent Scans</h3>
            <ul>
              {history.map((item, index) => (
                <li
                  key={index}
                  className={`history-item history-item--${item.status === "Present" ? "success" : item.status === "Already Present" ? "warning" : "error"}`}
                >
                  <span className="history-status">{item.status}</span>
                  <span className="history-name">{item.value}</span>
                  <span className="history-time">{item.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
