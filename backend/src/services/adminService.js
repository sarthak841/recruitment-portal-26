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
