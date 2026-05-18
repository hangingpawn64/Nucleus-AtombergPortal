import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function getClient(supabaseClient) {
  const supabase = supabaseClient || createBrowserSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

export const CycleService = {
  async listCycles(supabaseClient) {
    const supabase = getClient(supabaseClient);
    const { data, error } = await supabase
      .from("goal_cycles")
      .select("*")
      .order("start_date", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createCycle(values, supabaseClient) {
    const supabase = getClient(supabaseClient);
    const { data, error } = await supabase
      .from("goal_cycles")
      .insert(values)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCycle(cycleId, values, supabaseClient) {
    const supabase = getClient(supabaseClient);
    const { data, error } = await supabase
      .from("goal_cycles")
      .update(values)
      .eq("id", cycleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
