import { GoalService } from "@/services/goal";
import { GoalSheetForm } from "@/components/forms/goal-sheet-form";
import { redirect } from "next/navigation";
import { ArrowLeft, Lock, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";

export default async function EditGoalSheetPage() {
  const supabase = await createServerSupabaseClient();
  let currentCycle = null;
  let goalSheet = null;

  try {
    currentCycle = await GoalService.getCurrentCycle(supabase);
    if (currentCycle) {
      goalSheet = await GoalService.getMyGoalSheet(currentCycle.id, supabase);
    }
  } catch (error) {
    console.error(error);
  }

  if (!currentCycle) {
    redirect("/app/goals");
  }

  const isLocked = Boolean(goalSheet?.locked) || goalSheet?.status === "submitted" || goalSheet?.status === "approved";
  const latestReworkComment = goalSheet?.comments?.find(
    (comment) => comment.comment_type === "rework" || comment.comment_type === "unlock",
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/app/goals">
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
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">
          <p className="flex items-center gap-2 font-medium">
            <Lock className="size-4" />
            This goal sheet is locked.
          </p>
          <p className="mt-1 text-sm">
            Submitted and approved sheets are read-only. An admin must unlock an approved sheet before edits.
          </p>
        </div>
      )}

      {goalSheet?.status === "rework" && latestReworkComment && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-orange-900">
          <p className="flex items-center gap-2 font-medium">
            <MessageSquare className="size-4" />
            Rework requested
          </p>
          <p className="mt-2 text-sm leading-6">{latestReworkComment.comment}</p>
          <p className="mt-2 text-xs text-orange-800">
            {formatDateTime(latestReworkComment.created_at)}
          </p>
        </div>
      )}

      <GoalSheetForm cycle={currentCycle} initialData={goalSheet} />
    </div>
  );
}
