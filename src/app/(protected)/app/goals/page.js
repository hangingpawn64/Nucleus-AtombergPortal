import { GoalService } from "@/services/goal.service";
import { Button } from "@/components/ui/button";
import { Plus, Edit3, Eye, MessageSquare, Lock } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/badges/status-badge";
import { GoalsTable } from "./goals-table";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime, personName } from "@/lib/utils";

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

  const latestFeedback = goalSheet?.comments?.find((comment) =>
    ["rework", "approval", "unlock", "general"].includes(comment.comment_type),
  );
  const isEditable =
    !goalSheet || (goalSheet.status === "draft" || goalSheet.status === "rework");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Goals</h1>
          <p className="text-muted-foreground">Manage your performance goals and tracking.</p>
        </div>
      </div>

      {!currentCycle ? (
        <div className="bg-card text-card-foreground p-8 rounded-lg border text-center space-y-4">
          <h3 className="text-lg font-medium">No Active Cycle</h3>
          <p className="text-muted-foreground">There is currently no active goal setting cycle open.</p>
        </div>
      ) : (
        <>
          <div className="bg-card text-card-foreground p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{currentCycle.name}</h3>
                <p className="text-sm text-muted-foreground">Quarter: {currentCycle.quarter}</p>
                {goalSheet?.manager && (
                  <p className="text-sm text-muted-foreground">
                    Manager: {personName(goalSheet.manager)}
                  </p>
                )}
              </div>
              <StatusBadge status={goalSheet?.status || "Not Started"} />
            </div>

            {goalSheet?.status === "rework" && latestFeedback && (
              <div className="mb-4 rounded-md border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/20 p-4 text-orange-900 dark:text-orange-200">
                <div className="flex items-center gap-2 font-medium">
                  <MessageSquare className="size-4" />
                  Manager feedback
                </div>
                <p className="mt-2 text-sm leading-6">{latestFeedback.comment}</p>
                <p className="mt-2 text-xs text-orange-800">
                  {formatDateTime(latestFeedback.created_at)}
                </p>
              </div>
            )}

            {goalSheet?.locked && (
              <div className="mb-4 flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                <Lock className="mt-0.5 size-4" />
                <span>
                  This sheet is locked while it is under review or approved.
                </span>
              </div>
            )}

            <div className="flex gap-4 border-t pt-4">
              {isEditable ? (
                <Link href="/app/goals/edit">
                  <Button>
                    {goalSheet ? <Edit3 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {goalSheet?.status === "rework"
                      ? "Update and Resubmit"
                      : goalSheet
                        ? "Continue Draft"
                        : "Create Goal Sheet"}
                  </Button>
                </Link>
              ) : (
                <Link href="/app/goals/edit">
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

          {goalSheet?.comments?.length > 0 && (
            <Card className="rounded-md">
              <CardHeader>
                <CardTitle className="text-base">Review History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {goalSheet.comments.slice(0, 4).map((comment) => (
                  <div key={comment.id} className="rounded-md border bg-muted/30 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium capitalize">
                        {comment.comment_type} note
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(comment.created_at)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6">{comment.comment}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
