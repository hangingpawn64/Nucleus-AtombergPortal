import { DataTable } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import { listActivityLogs } from "@/services/activity";

export const metadata = {
  title: "Activity | AtomQuest Portal",
};

const columns = [
  { key: "action", header: "Action" },
  { key: "entity_type", header: "Entity" },
  {
    key: "created_at",
    header: "Created",
    render: (row) => formatDateTime(row.created_at),
  },
];

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="text-sm text-muted-foreground">
          Your goal workflow events and visible team activity.
        </p>
      </div>
      <DataTable
        columns={columns}
        data={logs}
        searchableKeys={["action", "entity_type"]}
        searchPlaceholder="Search activity"
      />
    </div>
  );
}
