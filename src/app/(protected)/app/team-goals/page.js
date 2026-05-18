import { TeamGoalSheetsClient } from "@/components/goals/team-goal-sheets-client";
import { ErrorState } from "@/components/empty-states/error-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GoalService } from "@/services/goal.service";

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

  const sheets = await GoalService.getTeamGoalSheets({}, supabase);

  return <TeamGoalSheetsClient sheets={sheets} />;
}
