import { ActivityLogList } from "@/components/activity/activity-log-list";
import { ErrorState } from "@/components/shared/error-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import {
  hydrateActivityActors,
  listActivityLogs,
} from "@/services/activity";

export const metadata = {
  title: "Audit Logs | Nucleus Portal",
};

export default async function AuditLogsPage() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return (
      <ErrorState
        title="Supabase is not configured"
        description="Connect Supabase before viewing audit logs."
      />
    );
  }

  const logs = await listActivityLogs({ orderBy: "created_at" }, supabase);
  const hydratedLogs = await hydrateActivityActors(logs, supabase);
  const rows = hydratedLogs.map((log) => ({
    ...log,
    formatted_created_at: formatDateTime(log.created_at),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">
          Workflow events, approvals, rework requests, and admin actions.
        </p>
      </div>
      <ActivityLogList logs={rows} />
    </div>
  );
}
