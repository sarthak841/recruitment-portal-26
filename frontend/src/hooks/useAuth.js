import { useCallback, useEffect, useRef, useState } from "react";
import { refreshSession } from "../lib/api";

const AUTH_STORAGE_KEY = "recruitmentPortalAuth";

// How many seconds before expiry we proactively refresh (2 min buffer)
const REFRESH_BUFFER_SECONDS = 120;

function hasValidSession(session) {
  return Boolean(session?.accessToken);
}

function readStoredAuth() {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return { authSession: null, candidateProfile: null };
    const parsed = JSON.parse(stored);
    return {
      authSession: parsed.authSession || null,
      candidateProfile: parsed.candidateProfile || null,
    };
  } catch {
    return { authSession: null, candidateProfile: null };
  }
}

function persistAuth(authSession, candidateProfile) {
  if (!hasValidSession(authSession)) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({ authSession, candidateProfile }),
  );
}

function buildProfile(profile, user, session, existing = {}) {
  return {
    ...existing,
    ...(profile || {}),
    email: user?.email ?? existing.email ?? "",
    userId: user?.id ?? existing.userId ?? null,
    accessToken: session?.accessToken ?? existing.accessToken ?? null,
  };
}

// Returns seconds until the access token expires (negative = already expired)
function secondsUntilExpiry(session) {
  if (!session?.expiresAt) return -1;
  return session.expiresAt - Math.floor(Date.now() / 1000);
}

// ── Safety net: normalize whatever shape the server returns into the
//    camelCase shape useAuth relies on throughout.
//    Handles both the snake_case raw model output AND the already-normalized
//    controller output, so this is idempotent.
function normalizeSession(raw) {
  if (!raw) return null;
  if (raw.accessToken) return raw; // already correct shape

  // Convert snake_case → camelCase
  const expiresAt = raw.expires_at
    ? typeof raw.expires_at === "number"
      ? raw.expires_at
      : Math.floor(new Date(raw.expires_at).getTime() / 1000)
    : null;

  return {
    accessToken: raw.access_token ?? null,
    refreshToken: raw.refresh_token ?? null,
    expiresAt,
  };
}

export function useAuth() {
  const [storedAuth] = useState(() => readStoredAuth());
  const [authSession, setAuthSession] = useState(storedAuth.authSession);
  const [candidateProfile, setCandidateProfile] = useState(
    storedAuth.candidateProfile,
  );
  const [authReady, setAuthReady] = useState(
    !hasValidSession(storedAuth.authSession),
  );

  // Keep a ref so the proactive refresh timer always sees the latest session
  const authSessionRef = useRef(authSession);
  const candidateProfileRef = useRef(candidateProfile);
  const refreshTimerRef = useRef(null);

  useEffect(() => { authSessionRef.current = authSession; }, [authSession]);
  useEffect(() => { candidateProfileRef.current = candidateProfile; }, [candidateProfile]);

  // ── Core refresh logic (callable from anywhere) ───────────────────────────
  const doRefresh = useCallback(async (sessionToRefresh) => {
    const session = sessionToRefresh ?? authSessionRef.current;
    if (!session?.refreshToken) return null;

    try {
      const restored = await refreshSession({ refreshToken: session.refreshToken });

      // Normalize the session shape — the server may return snake_case keys
      // (access_token / refresh_token / expires_at) instead of camelCase.
      // Without this, accessToken is undefined after a refresh and every
      // subsequent getFreshToken() call returns null → "session expired".
      const normalizedSession = normalizeSession(restored.session);

      const profile = buildProfile(
        restored.profile,
        restored.user,
        normalizedSession,
        candidateProfileRef.current,
      );

      persistAuth(normalizedSession, profile);
      setAuthSession(normalizedSession);
      setCandidateProfile(profile);
      return normalizedSession;
    } catch {
      // Refresh token itself expired — force logout
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setAuthSession(null);
      setCandidateProfile(null);
      return null;
    }
  }, []);

  // ── Schedule a proactive silent refresh before the token expires ──────────
  const scheduleRefresh = useCallback((session) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    if (!session?.expiresAt || !session?.refreshToken) return;

    const secsLeft = secondsUntilExpiry(session);
    const delay = Math.max(0, secsLeft - REFRESH_BUFFER_SECONDS) * 1000;

    refreshTimerRef.current = setTimeout(() => {
      doRefresh(session);
    }, delay);
  }, [doRefresh]);

  // Re-schedule whenever session changes
  useEffect(() => {
    scheduleRefresh(authSession);
    return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); };
  }, [authSession, scheduleRefresh]);

  // ── On mount: restore session via refresh token ───────────────────────────
  useEffect(() => {
    async function restoreSession() {
      if (!hasValidSession(storedAuth.authSession)) return;
      await doRefresh(storedAuth.authSession);
      setAuthReady(true);
    }
    restoreSession().finally(() => setAuthReady(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist whenever state changes ────────────────────────────────────────
  useEffect(() => {
    persistAuth(authSession, candidateProfile);
  }, [authSession, candidateProfile]);

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Call this before any authenticated request if you want to guarantee a
   * fresh token. Returns the current valid access token, refreshing first if
   * the token is within REFRESH_BUFFER_SECONDS of expiry or already expired.
   */
  const getFreshToken = useCallback(async () => {
    const session = authSessionRef.current;
    if (!session?.accessToken) return null;

    const secsLeft = secondsUntilExpiry(session);
    if (secsLeft > REFRESH_BUFFER_SECONDS) {
      // Token is still fresh
      return session.accessToken;
    }

    // Token is expired or about to — refresh now
    const newSession = await doRefresh(session);
    return newSession?.accessToken ?? null;
  }, [doRefresh]);

  const login = (payload) => {
    const profile = buildProfile(payload.profile, payload.user, payload.session);
    persistAuth(payload.session, profile);
    setAuthSession(payload.session);
    setCandidateProfile(profile);
  };

  const register = (payload) => {
    const profile = buildProfile(payload.profile, payload.user, payload.session);
    persistAuth(payload.session, profile);
    setAuthSession(payload.session);
    setCandidateProfile(profile);
  };

  const saveProfile = (savedProfile) => {
    setCandidateProfile((current) =>
      buildProfile(savedProfile, null, authSession, current),
    );
  };

  const logout = () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthSession(null);
    setCandidateProfile(null);
  };

  return {
    authReady,
    authSession,
    candidateProfile,
    login,
    register,
    saveProfile,
    logout,
    getFreshToken,
  };
}