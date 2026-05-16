import { CycleManagementClient } from "@/components/admin/cycle-management-client";
import { ErrorState } from "@/components/shared/error-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CycleService } from "@/services/cycles";

export const metadata = {
  title: "Cycle Management | AtomQuest Portal",
};

export default async function CycleManagementPage() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return (
      <ErrorState
        title="Supabase is not configured"
        description="Connect Supabase before managing goal cycles."
      />
    );
  }

  const cycles = await CycleService.listCycles(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cycle Management</h1>
        <p className="text-sm text-muted-foreground">
          Create cycles and control the active goal-setting window.
        </p>
      </div>
      <CycleManagementClient initialCycles={cycles} />
    </div>
  );
}
