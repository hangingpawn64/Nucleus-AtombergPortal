"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageSquare, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/status-badge";
import { CheckinService } from "@/services/checkins";
import { formatDateTime } from "@/lib/utils";

function latestCheckin(goal, quarter) {
  return (
    (goal.checkins || []).find((checkin) => checkin.quarter === quarter) ||
    (goal.checkins || [])[0] ||
    null
  );
}

function displayProgress(value) {
  if (value == null) return "No score";
  return `${value}%`;
}

function getInitialValues(goals, quarter) {
  return goals.reduce((values, goal) => {
    const checkin = latestCheckin(goal, quarter);
    values[goal.id] = {
      plannedValue: checkin?.planned_value ?? goal.target_value ?? "",
      actualValue: checkin?.actual_value ?? "",
      status: checkin?.status || "draft",
      progressScore: checkin?.progress_score ?? null,
    };
    return values;
  }, {});
}

export function EmployeeCheckinsClient({ currentCycle, goalSheet }) {
  const router = useRouter();
  const quarter = currentCycle?.quarter || "Current quarter";
  const approvedGoals = useMemo(
    () => (goalSheet?.status === "approved" ? goalSheet.goals || [] : []),
    [goalSheet],
  );
  const [values, setValues] = useState(() => getInitialValues(approvedGoals, quarter));
  const [busyGoalId, setBusyGoalId] = useState(null);

  const completion = useMemo(() => {
    if (!approvedGoals.length) return 0;
    const submitted = approvedGoals.filter((goal) => {
      const status = values[goal.id]?.status;
      return status === "submitted" || status === "approved";
    }).length;
    return Math.round((submitted / approvedGoals.length) * 100);
  }, [approvedGoals, values]);

  function updateGoal(goalId, field, value) {
    setValues((current) => {
      const next = {
        ...current[goalId],
        [field]: value,
      };
      next.progressScore = CheckinService.progressScore(
        next.actualValue,
        next.plannedValue,
      );

      return {
        ...current,
        [goalId]: next,
      };
    });
  }

  async function saveCheckin(goal, status) {
    const current = values[goal.id] || {};

    try {
      setBusyGoalId(goal.id);
      const saved = await CheckinService.saveCheckin({
        goalId: goal.id,
        quarter,
        plannedValue: current.plannedValue,
        actualValue: current.actualValue,
        progressScore: current.progressScore,
        status,
      });

      setValues((nextValues) => ({
        ...nextValues,
        [goal.id]: {
          ...nextValues[goal.id],
          status: saved.status,
          progressScore: saved.progress_score,
        },
      }));
      toast.success(status === "submitted" ? "Check-in submitted" : "Check-in draft saved");
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Could not save check-in");
    } finally {
      setBusyGoalId(null);
    }
  }

  if (!currentCycle) {
    return (
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle>No active cycle</CardTitle>
          <CardDescription>
            Check-ins open after an active goal cycle is available.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (goalSheet?.status !== "approved") {
    return (
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle>Goals need approval first</CardTitle>
          <CardDescription>
            Your check-in workspace opens once your manager approves your goal sheet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={goalSheet?.status || "draft"} />
            <Button asChild variant="outline">
              <Link href="/app/goals">
                Open My Goals
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Current cycle</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{currentCycle.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{quarter}</p>
          </CardContent>
        </Card>
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Approved goals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{approvedGoals.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">Ready for updates</p>
          </CardContent>
        </Card>
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Submitted updates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{completion}%</p>
            <p className="mt-1 text-sm text-muted-foreground">For {quarter}</p>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-4">
        {approvedGoals.map((goal) => {
          const current = values[goal.id] || {};
          const checkin = latestCheckin(goal, quarter);
          const comments = checkin?.comments || [];
          const isBusy = busyGoalId === goal.id;

          return (
            <Card key={goal.id} className="rounded-md">
              <CardHeader>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle>{goal.title}</CardTitle>
                    <CardDescription>
                      {goal.thrust_area} | {goal.weightage}% weightage
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={current.status || "draft"} />
                    <span className="rounded-md border px-2 py-1 text-sm font-medium">
                      {displayProgress(current.progressScore)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor={`planned-${goal.id}`}>Planned value</Label>
                    <Input
                      id={`planned-${goal.id}`}
                      type="number"
                      value={current.plannedValue ?? ""}
                      onChange={(event) =>
                        updateGoal(goal.id, "plannedValue", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`actual-${goal.id}`}>Quarterly achievement</Label>
                    <Input
                      id={`actual-${goal.id}`}
                      type="number"
                      value={current.actualValue ?? ""}
                      onChange={(event) =>
                        updateGoal(goal.id, "actualValue", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Manager comments</Label>
                    <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                      {comments.length} visible
                    </div>
                  </div>
                </div>

                {comments.length > 0 && (
                  <div className="space-y-2 rounded-md border bg-muted/20 p-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="text-sm">
                        <p className="flex items-center gap-2 font-medium">
                          <MessageSquare className="size-4" />
                          Manager feedback
                        </p>
                        <p className="mt-1 leading-6 text-muted-foreground">
                          {comment.comment}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDateTime(comment.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => saveCheckin(goal, "draft")}
                  >
                    <Save className="size-4" />
                    Save Draft
                  </Button>
                  <Button
                    type="button"
                    disabled={isBusy || current.actualValue === ""}
                    onClick={() => saveCheckin(goal, "submitted")}
                  >
                    <Send className="size-4" />
                    Submit Update
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
