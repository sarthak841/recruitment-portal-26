import {
  createUser,
  getUserByToken,
  signIn,
  refreshSession,
} from "../models/authModel.js";
import {
  findCandidateByUserId,
  mapCandidatePayload,
  upsertCandidateProfile,
  validateCandidatePayload,
} from "../models/candidateModel.js";
import { getGlobalLock } from "./adminService.js";

// ── Convert whatever expires_at the model returns into a Unix timestamp
//    (seconds). authModel.signIn returns a number already; authModel.refreshSession
//    returns an ISO string. Normalising here means useAuth.js secondsUntilExpiry()
//    always gets a number, not NaN, so tokens are never wrongly treated as expired.
function toUnixSeconds(value) {
  if (!value) return null;
  if (typeof value === "number") return value;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
}

export function buildSessionResponse(session, user, profile = null, redirectTo = null) {
  return {
    session: session
      ? {
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresAt: toUnixSeconds(session.expires_at),
        }
      : null,
    user: {
      id: user.id,
      email: user.email,
    },
    profile,
    redirectTo,
  };
}

export function bearerToken(req) {
  const authorization = req.headers.authorization || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7) : null;
}

export async function fetchCandidateProfile(userId) {
  const { data, error } = await findCandidateByUserId(userId);
  if (error) throw error;
  return data;
}

export async function registerUser(email, password) {
  const globallyLocked = await getGlobalLock();
  if (globallyLocked) {
    return {
      error: {
        message: "Registrations are currently closed. New sign-ups are not allowed.",
      },
    };
  }

  const { data: createdUser, error: createError } = await createUser(email, password);
  if (createError) return { error: createError };

  const { data, error } = await signIn(email, password);

  return {
    data: error
      ? buildSessionResponse(null, createdUser.user, null, "/candidate-details")
      : buildSessionResponse(data.session, data.user, null, "/candidate-details"),
  };
}

export async function loginUser(email, password) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  if (
    adminEmail &&
    adminPassword &&
    email.toLowerCase() === adminEmail &&
    password === adminPassword
  ) {
    return { data: { isAdmin: true, redirectTo: "/admin-dashboard" } };
  }

  const { data, error } = await signIn(email, password);
  if (error) return { error };

  return {
    data: buildSessionResponse(
      data.session,
      data.user,
      await fetchCandidateProfile(data.user.id),
      "/dashboard",
    ),
  };
}

export async function refreshUserSession(refreshToken) {
  const { data, error } = await refreshSession(refreshToken);
  if (error) return { error };

  return {
    data: buildSessionResponse(
      data.session,
      data.user,
      await fetchCandidateProfile(data.user.id),
      "/dashboard",
    ),
  };
}

export async function userFromToken(token) {
  const { data, error } = await getUserByToken(token);
  if (error || !data?.user) return null;
  return data.user;
}

export async function saveCandidate(body, user) {
  const globallyLocked = await getGlobalLock();
  if (globallyLocked) {
    return {
      status: 403,
      error: "Registrations are currently closed. No new submissions are allowed.",
    };
  }

  const missingFields = validateCandidatePayload(body);
  if (missingFields.length) {
    return {
      status: 400,
      error: `Missing required candidate details: ${missingFields.join(", ")}`,
    };
  }

  const { data, error } = await upsertCandidateProfile(mapCandidatePayload(body, user));
  if (error) return { status: 400, error: error.message };

  return { data };
}