import { AdminGoalSheetsClient } from "@/components/admin/admin-goal-sheets-client";
import { ErrorState } from "@/components/shared/error-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { personName } from "@/lib/utils";
import { GoalService } from "@/services/goal";

export const metadata = {
  title: "Goal Progress | Nucleus Portal",
};

export default async function AdminGoalsPage() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return (
      <ErrorState
        title="Supabase is not configured"
        description="Connect Supabase before viewing goal sheets."
      />
    );
  }

  const sheets = await GoalService.getAllGoalSheets({}, supabase);
  const searchableSheets = sheets.map((sheet) => ({
    ...sheet,
    employee_search: personName(sheet.employee, sheet.employee?.email),
    manager_search: personName(sheet.manager, "Unassigned"),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Goal Progress</h1>
        <p className="text-sm text-muted-foreground">
          Organization-wide goal visibility, approval state, and admin unlock controls.
        </p>
      </div>
      <AdminGoalSheetsClient initialSheets={searchableSheets} />
    </div>
  );
}
