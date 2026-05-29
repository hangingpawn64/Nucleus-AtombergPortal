import { TeamGoalSheetsClient } from "@/components/goals/team-goal-sheets-client";
import { ErrorState } from "@/components/empty-states/error-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GoalService } from "@/services/goal.service";
import { UserService } from "@/services/user.service";

export const metadata = {
  title: "Team Goals | Nucleus Portal",
};

export default async function TeamGoalSheetsPage() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return (
      <ErrorState
        title="Supabase is not configured"
        description="Connect Supabase before reviewing team goals."
      />
    );
  }

  const [sheets, users, currentCycle] = await Promise.all([
    GoalService.getTeamGoalSheets({}, supabase),
    UserService.listUsersForAdmin(supabase),
    GoalService.getCurrentCycle(supabase),
  ]);

  const employees = users.filter(
    (user) => user.role === "employee" && user.status === "active",
  );

  return (
    <TeamGoalSheetsClient
      sheets={sheets}
      employees={employees}
      currentCycle={currentCycle}
    />
  );
}
