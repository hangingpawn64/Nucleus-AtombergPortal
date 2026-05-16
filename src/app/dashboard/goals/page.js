import { GoalService } from "@/services/goal";
import { Button } from "@/components/ui/button";
import { Plus, Edit3, Eye } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { GoalsTable } from "./goals-table";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function GoalsDashboardPage() {
  const supabase = await createServerSupabaseClient();
  let currentCycle = null;
  let goalSheet = null;

  try {
    currentCycle = await GoalService.getCurrentCycle(supabase);
    if (currentCycle) {
      goalSheet = await GoalService.getMyGoalSheet(currentCycle.id, supabase);
    }
  } catch (error) {
    // If not found, goalSheet remains null
    console.error(error);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Goals</h1>
          <p className="text-muted-foreground">Manage your performance goals and tracking.</p>
        </div>
      </div>

      {!currentCycle ? (
        <div className="bg-white p-8 rounded-lg border text-center space-y-4">
          <h3 className="text-lg font-medium">No Active Cycle</h3>
          <p className="text-muted-foreground">There is currently no active goal setting cycle open.</p>
        </div>
      ) : (
        <>
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{currentCycle.name}</h3>
                <p className="text-sm text-muted-foreground">Quarter: {currentCycle.quarter}</p>
              </div>
              <StatusBadge status={goalSheet?.status || "Not Started"} />
            </div>

            <div className="flex gap-4 border-t pt-4">
              {!goalSheet || goalSheet.status === "draft" || goalSheet.status === "rework" ? (
                <Link href="/dashboard/goals/edit">
                  <Button>
                    {goalSheet ? <Edit3 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {goalSheet ? "Continue Draft" : "Create Goal Sheet"}
                  </Button>
                </Link>
              ) : (
                <Link href="/dashboard/goals/edit">
                  <Button variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    View Goal Sheet
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {goalSheet?.goals?.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Current Goals</h3>
              <GoalsTable goals={goalSheet.goals} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
