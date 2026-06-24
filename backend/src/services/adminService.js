import { supabaseAdmin } from "../config/supabase.js";

export async function fetchAllCandidates() {
  const { data, error } = await supabaseAdmin
    .from("candidate_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateStatus(id, status) {
  const { data, error } = await supabaseAdmin
    .from("candidate_profiles")
    .update({ application_status: status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAttendance(id, present) {
  const updatePayload = {
    quiz_attended: present,
    quiz_attended_at: present ? new Date().toISOString() : null,
  };

  const { data, error } = await supabaseAdmin
    .from("candidate_profiles")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCandidate(id) {
  const { error } = await supabaseAdmin
    .from("candidate_profiles")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function markQuizAttendance(qrToken) {
  const { data: candidate, error: candidateError } = await supabaseAdmin
    .from("candidate_profiles")
    .select("*")
    .eq("qr_token", qrToken)
    .single();

  if (candidateError || !candidate) {
    throw new Error("Candidate not found");
  }

  if (candidate.quiz_attended) {
    return { alreadyPresent: true, candidate };
  }

  const { data: updatedCandidate, error: updateError } = await supabaseAdmin
    .from("candidate_profiles")
    .update({
      quiz_attended: true,
      quiz_attended_at: new Date().toISOString(),
    })
    .eq("id", candidate.id)
    .select()
    .single();

  if (updateError) throw updateError;

  return { alreadyPresent: false, candidate: updatedCandidate };
}

export async function getAttendanceStatsService() {
  const { count: totalCandidates, error: totalError } = await supabaseAdmin
    .from("candidate_profiles")
    .select("*", { count: "exact", head: true });

  if (totalError) throw totalError;

  const { count: presentCandidates, error: presentError } = await supabaseAdmin
    .from("candidate_profiles")
    .select("*", { count: "exact", head: true })
    .eq("quiz_attended", true);

  if (presentError) throw presentError;

  return { totalCandidates, presentCandidates };
}

// ── Form lock ──────────────────────────────────────────────────────────────

export async function toggleFormLock(id, locked) {
  const { data, error } = await supabaseAdmin
    .from("candidate_profiles")
    .update({ form_locked: locked })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── Candidate self-edit ────────────────────────────────────────────────────

const EDITABLE_FIELDS = [
  "full_name",
  "date_of_birth",
  "attendance",
  "join_reason",
  "primary_department",
  "secondary_department",
  "other_societies",
  "recruit_reason",
];

export async function updateCandidateDetails(userId, body) {
  // First check if the form is locked
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("candidate_profiles")
    .select("id, form_locked")
    .eq("user_id", userId)
    .single();

  if (fetchError || !existing) throw new Error("Candidate profile not found.");
  if (existing.form_locked)
    throw new Error(
      "Your form has been locked by the admin. No further changes can be made.",
    );

  // Build a safe update payload — only allowed fields
  const payload = {};
  for (const field of EDITABLE_FIELDS) {
    if (
      body[field] !== undefined &&
      body[field] !== null &&
      String(body[field]).trim() !== ""
    ) {
      payload[field] = String(body[field]).trim();
    }
  }

  if (!Object.keys(payload).length) {
    throw new Error("No valid fields provided for update.");
  }

  const { data, error } = await supabaseAdmin
    .from("candidate_profiles")
    .update(payload)
    .eq("id", existing.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
