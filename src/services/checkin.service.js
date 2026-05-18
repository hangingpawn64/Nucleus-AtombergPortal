import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { GoalService } from "@/services/goal.service";
import { createActivityLog } from "./activity.service";

function getClient(supabaseClient) {
  const supabase = supabaseClient || createBrowserSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function numericOrNull(value) {
  if (value === "" || value == null) return null;
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? null : numberValue;
}

function progressScore(actualValue, plannedValue) {
  const actual = numericOrNull(actualValue);
  const planned = numericOrNull(plannedValue);

  if (actual == null || planned == null || planned === 0) return null;
  return Math.max(0, Math.min(100, Math.round((actual / planned) * 100)));
}

async function hydrateCheckinAuthors(checkins = [], supabase) {
  const managerIds = [
    ...new Set(
      checkins
        .flatMap((checkin) =>
          (checkin.checkin_comments || []).map((comment) => comment.manager_id),
        )
        .filter(Boolean),
    ),
  ];

  if (!managerIds.length) return checkins;

  const [usersResult, profilesResult] = await Promise.all([
    supabase.from("users").select("id,email,role").in("id", managerIds),
    supabase
      .from("profiles")
      .select("id,user_id,full_name,first_name,last_name")
      .in("user_id", managerIds),
  ]);

  if (usersResult.error) throw usersResult.error;
  if (profilesResult.error) throw profilesResult.error;

  const profilesByUserId = new Map(
    (profilesResult.data || []).map((profile) => [profile.user_id, profile]),
  );
  const usersById = new Map(
    (usersResult.data || []).map((user) => [
      user.id,
      { ...user, profile: profilesByUserId.get(user.id) || null },
    ]),
  );

  return checkins.map((checkin) => ({
    ...checkin,
    comments: (checkin.checkin_comments || [])
      .map((comment) => ({
        ...comment,
        manager: usersById.get(comment.manager_id) || null,
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
  }));
}

async function listCheckinsForGoals(goalIds = [], supabase) {
  if (!goalIds.length) return new Map();

  const { data, error } = await supabase
    .from("goal_checkins")
    .select("*, checkin_comments (*)")
    .in("goal_id", goalIds)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const checkins = await hydrateCheckinAuthors(data || [], supabase);
  return checkins.reduce((byGoalId, checkin) => {
    const existing = byGoalId.get(checkin.goal_id) || [];
    byGoalId.set(checkin.goal_id, [...existing, checkin]);
    return byGoalId;
  }, new Map());
}

function attachCheckinsToSheet(sheet, checkinsByGoalId) {
  if (!sheet) return null;

  return {
    ...sheet,
    goals: (sheet.goals || []).map((goal) => ({
      ...goal,
      checkins: checkinsByGoalId.get(goal.id) || [],
    })),
  };
}

export const CheckinService = {
  progressScore,

  async getEmployeeWorkspace(supabaseClient) {
    const supabase = getClient(supabaseClient);
    const currentCycle = await GoalService.getCurrentCycle(supabase);
    const goalSheet = currentCycle
      ? await GoalService.getMyGoalSheet(currentCycle.id, supabase)
      : null;

    const goalIds = (goalSheet?.goals || []).map((goal) => goal.id);
    const checkinsByGoalId = await listCheckinsForGoals(goalIds, supabase);

    return {
      currentCycle,
      goalSheet: attachCheckinsToSheet(goalSheet, checkinsByGoalId),
    };
  },

  async getTeamWorkspace(supabaseClient) {
    const supabase = getClient(supabaseClient);
    const [currentCycle, sheets] = await Promise.all([
      GoalService.getCurrentCycle(supabase),
      GoalService.getTeamGoalSheets({}, supabase),
    ]);
    const goalIds = sheets.flatMap((sheet) =>
      (sheet.goals || []).map((goal) => goal.id),
    );
    const checkinsByGoalId = await listCheckinsForGoals(goalIds, supabase);

    return {
      currentCycle,
      sheets: sheets.map((sheet) => attachCheckinsToSheet(sheet, checkinsByGoalId)),
    };
  },

  async saveCheckin(values, supabaseClient) {
    const supabase = getClient(supabaseClient);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const payload = {
      goal_id: values.goalId,
      quarter: values.quarter,
      planned_value: numericOrNull(values.plannedValue),
      actual_value: numericOrNull(values.actualValue),
      progress_score:
        values.progressScore ?? progressScore(values.actualValue, values.plannedValue),
      status: values.status || "draft",
    };

    const { data: existing, error: existingError } = await supabase
      .from("goal_checkins")
      .select("id")
      .eq("goal_id", values.goalId)
      .eq("quarter", values.quarter)
      .limit(1)
      .maybeSingle();

    if (existingError) throw existingError;

    const query = existing
      ? supabase
          .from("goal_checkins")
          .update(payload)
          .eq("id", existing.id)
          .select()
          .single()
      : supabase.from("goal_checkins").insert(payload).select().single();

    const { data, error } = await query;
    if (error) throw error;

    await createActivityLog(
      {
        actor_id: user.id,
        action: payload.status === "submitted" ? "submitted_checkin" : "updated_checkin",
        entity_type: "goal_checkins",
        entity_id: data.id,
        metadata: { goal_id: values.goalId, quarter: values.quarter },
      },
      supabase,
    );

    return data;
  },

  async addManagerComment(checkinId, comment, supabaseClient) {
    const supabase = getClient(supabaseClient);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("checkin_comments")
      .insert({
        checkin_id: checkinId,
        manager_id: user.id,
        comment,
      })
      .select()
      .single();

    if (error) throw error;

    await createActivityLog(
      {
        actor_id: user.id,
        action: "added_checkin_feedback",
        entity_type: "goal_checkins",
        entity_id: checkinId,
      },
      supabase,
    );

    return data;
  },
};
