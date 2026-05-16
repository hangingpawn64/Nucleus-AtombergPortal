import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { createActivityLog } from "./activity";
import { createNotification } from "./notifications";

export const GoalService = {
  getClient(supabaseClient) {
    const supabase = supabaseClient || createBrowserSupabaseClient();
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }
    return supabase;
  },

  async getCurrentCycle(supabaseClient) {
    const supabase = this.getClient(supabaseClient);
    const { data, error } = await supabase
      .from("goal_cycles")
      .select("*")
      .eq("status", "active")
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching current cycle:", error);
      throw error;
    }
    return data;
  },

  async getMyGoalSheet(cycleId, supabaseClient) {
    const supabase = this.getClient(supabaseClient);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("goal_sheets")
      .select(`
        *,
        goals (*)
      `)
      .eq("employee_id", user.id)
      .eq("cycle_id", cycleId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching goal sheet:", error);
      throw error;
    }

    return data;
  },

  async saveDraft(cycleId, goalsData, supabaseClient) {
    const supabase = this.getClient(supabaseClient);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // 1. Get or Create Sheet
    let sheetId;
    const { data: existingSheet } = await supabase
      .from("goal_sheets")
      .select("id, status")
      .eq("employee_id", user.id)
      .eq("cycle_id", cycleId)
      .single();

    if (existingSheet) {
      if (existingSheet.status !== 'draft' && existingSheet.status !== 'rework') {
        throw new Error("Cannot edit a submitted or approved goal sheet.");
      }
      sheetId = existingSheet.id;
    } else {
      const { data: newSheet, error: createError } = await supabase
        .from("goal_sheets")
        .insert({
          employee_id: user.id,
          cycle_id: cycleId,
          status: 'draft'
        })
        .select()
        .single();
      
      if (createError) throw createError;
      sheetId = newSheet.id;

      await createActivityLog({
        actor_id: user.id,
        action: "created_goal_sheet",
        entity_type: "goal_sheets",
        entity_id: sheetId,
        metadata: { cycle_id: cycleId }
      }, supabase);
    }

    // 2. Manage Goals
    // Clear existing goals for simplicity in draft save, then re-insert
    // In production, an upsert is better, but this works well for drafts
    await supabase.from("goals").delete().eq("goal_sheet_id", sheetId);

    if (goalsData && goalsData.length > 0) {
      const goalsToInsert = goalsData.map(g => ({
        goal_sheet_id: sheetId,
        thrust_area: g.thrust_area,
        title: g.title,
        description: g.description,
        uom_type: g.uom_type,
        target_value: g.target_value,
        weightage: g.weightage,
        deadline: g.deadline,
        status: 'not_started'
      }));

      const { error: insertError } = await supabase.from("goals").insert(goalsToInsert);
      if (insertError) throw insertError;

      await createActivityLog({
        actor_id: user.id,
        action: "updated_goals",
        entity_type: "goal_sheets",
        entity_id: sheetId,
        metadata: { count: goalsToInsert.length }
      }, supabase);
    }

    return sheetId;
  },

  async submitGoalSheet(cycleId, goalsData, supabaseClient) {
    const supabase = this.getClient(supabaseClient);
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Save draft first
    const sheetId = await this.saveDraft(cycleId, goalsData, supabase);

    // 2. Update status to submitted
    const { error: updateError } = await supabase
      .from("goal_sheets")
      .update({ status: 'submitted', submitted_at: new Date().toISOString(), locked: true })
      .eq("id", sheetId);

    if (updateError) throw updateError;

    await createActivityLog({
      actor_id: user.id,
      action: "submitted_goal_sheet",
      entity_type: "goal_sheets",
      entity_id: sheetId
    }, supabase);

    await createNotification({
      user_id: user.id,
      title: "Goal Sheet Submitted",
      body: "Your goal sheet has been successfully submitted for approval.",
      type: "success"
    }, supabase);

    return sheetId;
  }
};
