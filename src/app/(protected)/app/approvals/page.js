import { TeamGoalSheetsClient } from "@/components/goals/team-goal-sheets-client";
import { ErrorState } from "@/components/empty-states/error-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GoalService } from "@/services/goal.service";

export const metadata = {
  title: "Approvals | Nucleus Portal",
};

export default async function ApprovalsPage() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return (
      <ErrorState
        title="Supabase is not configured"
        description="Connect Supabase before reviewing approvals."
      />
    );
  }

  const sheets = await GoalService.getTeamGoalSheets({ submittedOnly: true }, supabase);

  return (
    <TeamGoalSheetsClient
      sheets={sheets}
      initialStatus="submitted"
      title="Pending Approvals"
      description="Review goal sheets that are waiting on manager action."
    />
  );
}
