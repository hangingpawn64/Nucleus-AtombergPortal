import { TeamCheckinsClient } from "@/components/checkins/team-checkins-client";
import { ErrorState } from "@/components/empty-states/error-state";
import { getCurrentPortalUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CheckinService } from "@/services/checkin.service";

export const metadata = {
  title: "Team Check-ins | Nucleus Portal",
};

export default async function TeamCheckinsPage() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return (
      <ErrorState
        title="Supabase is not configured"
        description="Connect Supabase before reviewing team check-ins."
      />
    );
  }

  const [portalUser, workspace] = await Promise.all([
    getCurrentPortalUser(supabase),
    CheckinService.getTeamWorkspace(supabase),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team Check-ins</h1>
        <p className="text-sm text-muted-foreground">
          Review quarterly updates, compare planned and actual progress, and add feedback.
        </p>
      </div>
      <TeamCheckinsClient
        currentCycle={workspace.currentCycle}
        sheets={workspace.sheets}
        canComment={portalUser?.role === "manager"}
      />
    </div>
  );
}
