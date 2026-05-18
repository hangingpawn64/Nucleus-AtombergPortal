import { ActivityLogList } from "@/components/activity/activity-log-list";
import { ErrorState } from "@/components/empty-states/error-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import {
  hydrateActivityActors,
  listActivityLogs,
} from "@/services/activity.service";

export const metadata = {
  title: "Activity | Nucleus Portal",
};

export default async function ActivityPage() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return (
      <ErrorState
        title="Supabase is not configured"
        description="Connect Supabase before viewing activity."
      />
    );
  }

  const logs = await listActivityLogs({ orderBy: "created_at" }, supabase);
  const hydratedLogs = await hydrateActivityActors(logs, supabase);
  const formattedLogs = hydratedLogs.map((log) => ({
    ...log,
    formatted_created_at: formatDateTime(log.created_at),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="text-sm text-muted-foreground">
          Your goal workflow events and visible team activity.
        </p>
      </div>
      <ActivityLogList logs={formattedLogs} />
    </div>
  );
}
