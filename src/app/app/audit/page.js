import { DataTable } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import { listActivityLogs } from "@/services/activity";

const columns = [
  { key: "action", header: "Action" },
  { key: "actor", header: "Actor" },
  { key: "entity_type", header: "Entity" },
  { key: "formatted_created_at", header: "Created" },
];

export const metadata = {
  title: "Audit Logs | AtomQuest Portal",
};

export default async function ActivityPage() {
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
  const actorIds = [...new Set(logs.map((log) => log.actor_id).filter(Boolean))];
  let usersById = new Map();

  if (actorIds.length) {
    const { data: users = [] } = await supabase
      .from("users")
      .select("id,email")
      .in("id", actorIds);
    usersById = new Map(users.map((user) => [user.id, user]));
  }

  const rows = logs.map((log) => ({
    ...log,
    actor: usersById.get(log.actor_id)?.email || "System",
    formatted_created_at: formatDateTime(log.created_at),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit logs</h1>
        <p className="text-sm text-muted-foreground">
          Workflow events, approvals, rework requests, and admin actions.
        </p>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        searchableKeys={["action", "actor", "entity_type"]}
        searchPlaceholder="Search activity"
        pageSize={10}
      />
    </div>
  );
}
