import { GoalService } from "@/services/goal";
import { GoalSheetForm } from "@/components/forms/goal-sheet-form";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function EditGoalSheetPage() {
  const supabase = await createServerSupabaseClient();
  let currentCycle = null;
  let goalSheet = null;

  try {
    currentCycle = await GoalService.getCurrentCycle(supabase);
    if (!currentCycle) {
      redirect("/dashboard/goals");
    }
    goalSheet = await GoalService.getMyGoalSheet(currentCycle.id, supabase);
  } catch (error) {
    console.error(error);
  }

  const isLocked = goalSheet?.status === "submitted" || goalSheet?.status === "approved";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/goals">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isLocked ? "View Goal Sheet" : "Edit Goal Sheet"}
          </h1>
          <p className="text-muted-foreground">
            {currentCycle.name} - Quarter {currentCycle.quarter}
          </p>
        </div>
      </div>

      {isLocked && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg">
          <p className="font-medium">This goal sheet is locked.</p>
          <p className="text-sm mt-1">It has been submitted or approved and can no longer be edited.</p>
        </div>
      )}

      <GoalSheetForm cycle={currentCycle} initialData={goalSheet} />
    </div>
  );
}
