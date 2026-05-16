import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { createActivityLog } from "./activity";

const sheetSelect = `
  *,
  goals (*),
  goal_cycles (*),
  goal_review_comments (*)
`;

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

async function hydrateGoalSheets(sheets = [], supabase) {
  if (!sheets.length) return [];

  const userIds = uniq(
    sheets.flatMap((sheet) => [
      sheet.employee_id,
      sheet.manager_id,
      sheet.reviewed_by,
      sheet.unlocked_by,
      ...(sheet.goal_review_comments || []).map((comment) => comment.author_id),
    ]),
  );

  if (!userIds.length) return sheets;

  const [usersResult, profilesResult] = await Promise.all([
    supabase
      .from("users")
      .select("id,email,role,status,created_at,updated_at")
      .in("id", userIds),
    supabase
      .from("profiles")
      .select("id,user_id,full_name,first_name,last_name,avatar_url")
      .in("user_id", userIds),
  ]);

  if (usersResult.error) throw usersResult.error;
  if (profilesResult.error) throw profilesResult.error;

  const users = usersResult.data || [];
  const profiles = profilesResult.data || [];

  const profilesByUserId = new Map(
    profiles.map((profile) => [profile.user_id, profile]),
  );
  const usersById = new Map(
    users.map((user) => [
      user.id,
      {
        ...user,
        profile: profilesByUserId.get(user.id) || null,
      },
    ]),
  );

  return sheets.map((sheet) => ({
    ...sheet,
    cycle: sheet.goal_cycles || null,
    employee: usersById.get(sheet.employee_id) || null,
    manager: usersById.get(sheet.manager_id) || null,
    reviewer: usersById.get(sheet.reviewed_by) || null,
    unlockedBy: usersById.get(sheet.unlocked_by) || null,
    comments: (sheet.goal_review_comments || [])
      .map((comment) => ({
        ...comment,
        author: usersById.get(comment.author_id) || null,
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
  }));
}

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
      .select(sheetSelect)
      .eq("employee_id", user.id)
      .eq("cycle_id", cycleId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching goal sheet:", error);
      throw error;
    }

    if (!data) return null;

    const [hydratedSheet] = await hydrateGoalSheets([data], supabase);
    return hydratedSheet;
  },

  async getGoalSheetById(sheetId, supabaseClient) {
    const supabase = this.getClient(supabaseClient);
    const { data, error } = await supabase
      .from("goal_sheets")
      .select(sheetSelect)
      .eq("id", sheetId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const [hydratedSheet] = await hydrateGoalSheets([data], supabase);
    return hydratedSheet;
  },

  async getTeamGoalSheets({ status, submittedOnly = false } = {}, supabaseClient) {
    const supabase = this.getClient(supabaseClient);
    let query = supabase
      .from("goal_sheets")
      .select(sheetSelect)
      .order("updated_at", { ascending: false });

    if (submittedOnly) {
      query = query.eq("status", "submitted");
    } else if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return hydrateGoalSheets(data || [], supabase);
  },

  async getAllGoalSheets({ status } = {}, supabaseClient) {
    return this.getTeamGoalSheets({ status }, supabaseClient);
  },

  async saveDraft(cycleId, goalsData, supabaseClient) {
    const supabase = this.getClient(supabaseClient);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // 1. Get or Create Sheet
    let sheetId;
    const { data: existingSheet } = await supabase
      .from("goal_sheets")
      .select("id, status, locked")
      .eq("employee_id", user.id)
      .eq("cycle_id", cycleId)
      .maybeSingle();

    if (existingSheet) {
      if (
        existingSheet.locked ||
        (existingSheet.status !== 'draft' && existingSheet.status !== 'rework')
      ) {
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
        target_value: g.target_value === "" || g.target_value == null ? null : g.target_value,
        weightage: g.weightage,
        deadline: g.deadline || null,
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

    // 1. Save draft first
    const sheetId = await this.saveDraft(cycleId, goalsData, supabase);

    // 2. Let the database enforce transition rules, locking, manager alerts,
    // and activity logging in one audited transaction.
    const { data, error } = await supabase.rpc("submit_goal_sheet", {
      p_goal_sheet_id: sheetId,
    });

    if (error) throw error;

    return data;
  },

  async approveGoalSheet(sheetId, comment, supabaseClient) {
    const supabase = this.getClient(supabaseClient);
    const { data, error } = await supabase.rpc("approve_goal_sheet", {
      p_goal_sheet_id: sheetId,
      p_comment: comment || null,
    });

    if (error) throw error;
    return data;
  },

  async requestRework(sheetId, comment, supabaseClient) {
    const supabase = this.getClient(supabaseClient);
    const { data, error } = await supabase.rpc("request_goal_sheet_rework", {
      p_goal_sheet_id: sheetId,
      p_comment: comment,
    });

    if (error) throw error;
    return data;
  },

  async unlockGoalSheet(sheetId, comment, supabaseClient) {
    const supabase = this.getClient(supabaseClient);
    const { data, error } = await supabase.rpc("unlock_goal_sheet", {
      p_goal_sheet_id: sheetId,
      p_comment: comment || null,
    });

    if (error) throw error;
    return data;
  },

  async addReviewComment(sheetId, comment, supabaseClient) {
    const supabase = this.getClient(supabaseClient);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("goal_review_comments")
      .insert({
        goal_sheet_id: sheetId,
        author_id: user.id,
        comment,
        comment_type: "general",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
