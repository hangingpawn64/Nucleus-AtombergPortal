import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { normalizeRole, ROLES } from "@/lib/auth/roles";
import { personName } from "@/lib/utils";
import {
  buildAchievementMeta,
  latestCheckin,
} from "@/lib/reports/achievement-calculations";

const reportSheetSelect = `
  id,
  employee_id,
  manager_id,
  cycle_id,
  status,
  submitted_at,
  approved_at,
  created_at,
  updated_at,
  goals (
    id,
    goal_sheet_id,
    thrust_area,
    title,
    description,
    uom_type,
    target_value,
    weightage,
    achievement_value,
    status,
    deadline,
    created_at,
    updated_at
  ),
  goal_cycles (
    id,
    name,
    quarter,
    status,
    start_date,
    end_date,
    created_at
  )
`;

function getClient(supabaseClient) {
  const supabase = supabaseClient || createBrowserSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function fullName(profile, fallbackEmail) {
  const name = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || profile?.full_name || fallbackEmail || "Unassigned user";
}

async function getCurrentReportUser(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("users")
    .select("id,email,role,status")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  return {
    id: user.id,
    email: user.email,
    status: data?.status || "active",
    ...data,
    role: normalizeRole(data?.role),
  };
}

function applyRoleScope(sheets, relationships, currentUser) {
  const role = normalizeRole(currentUser?.role);

  if (role === ROLES.admin) return sheets;

  if (role === ROLES.manager) {
    const teamEmployeeIds = new Set(
      relationships
        .filter((relationship) => relationship.manager_id === currentUser.id)
        .map((relationship) => relationship.employee_id),
    );

    return sheets.filter(
      (sheet) =>
        sheet.manager_id === currentUser.id ||
        teamEmployeeIds.has(sheet.employee_id),
    );
  }

  return sheets.filter((sheet) => sheet.employee_id === currentUser.id);
}

function hydrateUsers(users = [], profiles = []) {
  const profilesByUserId = new Map(
    profiles.map((profile) => [profile.user_id, profile]),
  );

  return new Map(
    users.map((user) => {
      const profile = profilesByUserId.get(user.id) || null;

      return [
        user.id,
        {
          ...user,
          profile,
          name: fullName(profile, user.email),
        },
      ];
    }),
  );
}

function buildRows({ sheets, usersById, checkinsByGoalId }) {
  return sheets.flatMap((sheet) => {
    const employee = usersById.get(sheet.employee_id) || null;
    const manager = usersById.get(sheet.manager_id) || null;
    const cycle = sheet.goal_cycles || null;

    return (sheet.goals || []).map((goal) => {
      const checkin = latestCheckin(checkinsByGoalId.get(goal.id) || []);
      const achievement = buildAchievementMeta(goal, checkin);
      const updatedAt = checkin?.updated_at || goal.updated_at || sheet.updated_at;

      return {
        id: `${sheet.id}-${goal.id}`,
        goalId: goal.id,
        goalSheetId: sheet.id,
        employeeId: sheet.employee_id,
        employeeName: personName(employee, employee?.email),
        employeeEmail: employee?.email || "No email",
        managerId: sheet.manager_id,
        managerName: manager ? personName(manager, manager.email) : "Unassigned",
        goalTitle: goal.title,
        goalStatus: goal.status || "not_started",
        goalCycleId: sheet.cycle_id,
        goalCycle: cycle?.name || "No cycle",
        goalCycleQuarter: cycle?.quarter || "",
        targetValue: achievement.targetValue,
        actualAchievement: achievement.actualValue,
        progress: achievement.progress,
        statusKey: achievement.statusKey,
        statusLabel: achievement.statusLabel,
        statusColor: achievement.statusColor,
        submissionStatus: sheet.status,
        lastUpdated: updatedAt,
        uomType: goal.uom_type,
        weightage: goal.weightage,
        thrustArea: goal.thrust_area,
        latestCheckinId: checkin?.id || null,
        latestCheckinStatus: checkin?.status || "draft",
      };
    });
  });
}

function filterOptions({ rows, cycles, usersById, relationships }) {
  const visibleEmployeeIds = unique(rows.map((row) => row.employeeId));
  const visibleManagerIds = unique([
    ...rows.map((row) => row.managerId),
    ...relationships
      .filter((relationship) => visibleEmployeeIds.includes(relationship.employee_id))
      .map((relationship) => relationship.manager_id),
  ]);

  return {
    cycles: cycles
      .filter((cycle) => rows.some((row) => row.goalCycleId === cycle.id))
      .map((cycle) => ({
        value: cycle.id,
        label: `${cycle.name}${cycle.quarter ? ` (${cycle.quarter})` : ""}`,
      })),
    employees: visibleEmployeeIds.map((employeeId) => {
      const employee = usersById.get(employeeId);
      return {
        value: employeeId,
        label: personName(employee, employee?.email),
      };
    }),
    teams: visibleManagerIds.map((managerId) => {
      const manager = usersById.get(managerId);
      return {
        value: managerId,
        label: manager ? personName(manager, manager.email) : "Unassigned",
      };
    }),
  };
}

export const ReportService = {
  async getAchievementReportData(supabaseClient) {
    const supabase = getClient(supabaseClient);
    const currentUser = await getCurrentReportUser(supabase);

    let sheetsQuery = supabase
      .from("goal_sheets")
      .select(reportSheetSelect)
      .order("updated_at", { ascending: false });

    if (currentUser.role === ROLES.employee) {
      sheetsQuery = sheetsQuery.eq("employee_id", currentUser.id);
    }

    const [sheetsResult, relationshipsResult, cyclesResult] = await Promise.all([
      sheetsQuery,
      supabase
        .from("manager_relationships")
        .select("id,employee_id,manager_id,status,effective_from,effective_to")
        .eq("status", "active")
        .is("effective_to", null),
      supabase
        .from("goal_cycles")
        .select("id,name,quarter,status,start_date,end_date,created_at")
        .order("start_date", { ascending: false }),
    ]);

    if (sheetsResult.error) throw sheetsResult.error;
    if (relationshipsResult.error) throw relationshipsResult.error;
    if (cyclesResult.error) throw cyclesResult.error;

    const relationships = relationshipsResult.data || [];
    const scopedSheets = applyRoleScope(
      sheetsResult.data || [],
      relationships,
      currentUser,
    );
    const goalIds = scopedSheets.flatMap((sheet) =>
      (sheet.goals || []).map((goal) => goal.id),
    );
    const userIds = unique([
      ...scopedSheets.flatMap((sheet) => [sheet.employee_id, sheet.manager_id]),
      ...relationships.flatMap((relationship) => [
        relationship.employee_id,
        relationship.manager_id,
      ]),
    ]);

    const [checkinsResult, usersResult, profilesResult] = await Promise.all([
      goalIds.length
        ? supabase
            .from("goal_checkins")
            .select(
              "id,goal_id,quarter,planned_value,actual_value,progress_score,status,created_at,updated_at",
            )
            .in("goal_id", goalIds)
            .order("updated_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      userIds.length
        ? supabase
            .from("users")
            .select("id,email,role,status,created_at,updated_at")
            .in("id", userIds)
        : Promise.resolve({ data: [], error: null }),
      userIds.length
        ? supabase
            .from("profiles")
            .select("id,user_id,full_name,first_name,last_name,avatar_url")
            .in("user_id", userIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (checkinsResult.error) throw checkinsResult.error;
    if (usersResult.error) throw usersResult.error;
    if (profilesResult.error) throw profilesResult.error;

    const checkinsByGoalId = (checkinsResult.data || []).reduce((map, checkin) => {
      const existing = map.get(checkin.goal_id) || [];
      map.set(checkin.goal_id, [...existing, checkin]);
      return map;
    }, new Map());
    const usersById = hydrateUsers(usersResult.data || [], profilesResult.data || []);
    const rows = buildRows({
      sheets: scopedSheets,
      usersById,
      checkinsByGoalId,
    });

    return {
      currentUser,
      rows,
      filters: filterOptions({
        rows,
        cycles: cyclesResult.data || [],
        usersById,
        relationships,
      }),
    };
  },
};
