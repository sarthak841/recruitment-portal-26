import { supabaseAdmin } from "../config/supabase.js";

export async function fetchAllCandidates() {
  const { data, error } = await supabaseAdmin
    .from("candidate_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function updateStatus(id, status) {
  const { data, error } = await supabaseAdmin
    .from("candidate_profiles")
    .update({ application_status: status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
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
    return {
      alreadyPresent: true,
      candidate,
    };
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

  if (updateError) {
    throw updateError;
  }

  return {
    alreadyPresent: false,
    candidate: updatedCandidate,
  };
}

export async function getAttendanceStatsService() {
  const { count: totalCandidates, error: totalError } = await supabaseAdmin
    .from("candidate_profiles")
    .select("*", {
      count: "exact",
      head: true,
    });

  if (totalError) {
    throw totalError;
  }

  const { count: presentCandidates, error: presentError } = await supabaseAdmin
    .from("candidate_profiles")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("quiz_attended", true);

  if (presentError) {
    throw presentError;
  }

  return {
    totalCandidates,
    presentCandidates,
  };
}
