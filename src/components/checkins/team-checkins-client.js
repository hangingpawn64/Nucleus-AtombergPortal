"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/empty-states/empty-state";
import { StatusBadge } from "@/components/badges/status-badge";
import { UserAvatar } from "@/components/profile/user-avatar";
import { CheckinService } from "@/services/checkin.service";
import { formatDateTime, personName } from "@/lib/utils";

function latestCheckin(goal, quarter) {
  return (
    (goal.checkins || []).find((checkin) => checkin.quarter === quarter) ||
    (goal.checkins || [])[0] ||
    null
  );
}

function progressLabel(checkin) {
  if (!checkin || checkin.progress_score == null) return "No update";
  return `${checkin.progress_score}%`;
}

function getSheetMetrics(sheets, quarter) {
  const goals = sheets.flatMap((sheet) => sheet.goals || []);
  const checkins = goals
    .map((goal) => latestCheckin(goal, quarter))
    .filter(Boolean);
  const submitted = checkins.filter((checkin) =>
    ["submitted", "approved"].includes(checkin.status),
  ).length;

  return {
    employees: new Set(sheets.map((sheet) => sheet.employee_id)).size,
    goals: goals.length,
    checkins: checkins.length,
    completion: goals.length ? Math.round((submitted / goals.length) * 100) : 0,
  };
}

export function TeamCheckinsClient({
  currentCycle,
  sheets = [],
  canComment = true,
}) {
  const router = useRouter();
  const quarter = currentCycle?.quarter || "Current quarter";
  const approvedSheets = sheets.filter((sheet) => sheet.status === "approved");
  const [query, setQuery] = useState("");
  const [comments, setComments] = useState({});
  const [busyCheckinId, setBusyCheckinId] = useState(null);

  const metrics = useMemo(
    () => getSheetMetrics(approvedSheets, quarter),
    [approvedSheets, quarter],
  );

  const filteredSheets = useMemo(() => {
    const normalizedQuery = query.toLowerCase();

    return approvedSheets.filter((sheet) => {
      const name = personName(sheet.employee, sheet.employee?.email).toLowerCase();
      return (
        !normalizedQuery ||
        name.includes(normalizedQuery) ||
        sheet.employee?.email?.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [approvedSheets, query]);

  async function addComment(checkinId) {
    const comment = comments[checkinId]?.trim();
    if (!comment) return;

    try {
      setBusyCheckinId(checkinId);
      await CheckinService.addManagerComment(checkinId, comment);
      setComments((current) => ({ ...current, [checkinId]: "" }));
      toast.success("Feedback added");
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Could not add feedback");
    } finally {
      setBusyCheckinId(null);
    }
  }

  if (!currentCycle) {
    return (
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle>No active cycle</CardTitle>
          <CardDescription>
            Team check-ins appear after a cycle is active and goals are approved.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Team members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{metrics.employees}</p>
            <p className="mt-1 text-sm text-muted-foreground">With approved goals</p>
          </CardContent>
        </Card>
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Tracked goals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{metrics.goals}</p>
            <p className="mt-1 text-sm text-muted-foreground">Across assigned employees</p>
          </CardContent>
        </Card>
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Check-ins started</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{metrics.checkins}</p>
            <p className="mt-1 text-sm text-muted-foreground">For {quarter}</p>
          </CardContent>
        </Card>
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{metrics.completion}%</p>
            <p className="mt-1 text-sm text-muted-foreground">Submitted updates</p>
          </CardContent>
        </Card>
      </section>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search employees"
          className="pl-9"
        />
      </div>

      {filteredSheets.length === 0 ? (
        <EmptyState
          title="No team check-ins found"
          description="Approved goals and submitted team updates will appear here."
        />
      ) : (
        <div className="grid gap-4">
          {filteredSheets.map((sheet) => {
            const employeeName = personName(sheet.employee, sheet.employee?.email);

            return (
              <Card key={sheet.id} className="rounded-md">
                <CardHeader>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <CardTitle>{employeeName}</CardTitle>
                      <CardDescription>
                        {sheet.employee?.email || "No email"} | {sheet.cycle?.name || "Current cycle"}
                      </CardDescription>
                    </div>
                    <StatusBadge status={sheet.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(sheet.goals || []).map((goal) => {
                    const checkin = latestCheckin(goal, quarter);
                    const managerComments = checkin?.comments || [];

                    return (
                      <div key={goal.id} className="rounded-md border p-4">
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                          <div className="min-w-0 space-y-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="font-semibold">{goal.title}</h3>
                                  {goal.shared_goal_id && (
                                    <Badge variant="outline">
                                      {goal.shared_goal_primary ? "Primary pushed KPI" : "Pushed KPI"}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {goal.thrust_area} | {goal.weightage}% weightage
                                </p>
                              </div>
                              <span className="w-fit rounded-md border px-2 py-1 text-sm font-medium">
                                {progressLabel(checkin)}
                              </span>
                            </div>

                            <div className="grid gap-3 text-sm sm:grid-cols-4">
                              <div>
                                <p className="text-muted-foreground">Planned</p>
                                <p className="font-medium">
                                  {checkin?.planned_value ?? goal.target_value ?? "Not set"}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Actual</p>
                                <p className="font-medium">
                                  {checkin?.actual_value ?? "No update"}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Status</p>
                                <StatusBadge status={checkin?.status || "draft"} />
                              </div>
                              <div>
                                <p className="text-muted-foreground">Updated</p>
                                <p className="font-medium">
                                  {checkin ? formatDateTime(checkin.updated_at) : "Pending"}
                                </p>
                              </div>
                            </div>

                            {managerComments.length > 0 && (
                              <div className="space-y-2 rounded-md bg-muted/30 p-3">
                                {managerComments.map((comment) => (
                                  <div key={comment.id} className="flex gap-3 text-sm">
                                    <UserAvatar person={comment.manager} size="sm" />
                                    <div className="min-w-0 flex-1">
                                      <p className="flex items-center gap-2 font-medium">
                                        <MessageSquare className="size-4" />
                                        Feedback
                                      </p>
                                      <p className="mt-1 leading-6 text-muted-foreground">
                                        {comment.comment}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="space-y-3">
                            <Textarea
                              value={comments[checkin?.id] || ""}
                              disabled={!checkin || !canComment}
                              onChange={(event) =>
                                setComments((current) => ({
                                  ...current,
                                  [checkin.id]: event.target.value,
                                }))
                              }
                              placeholder={
                                checkin
                                  ? "Add feedback for this update"
                                  : "Waiting for employee update"
                              }
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              disabled={
                                !checkin ||
                                !canComment ||
                                busyCheckinId === checkin.id ||
                                !comments[checkin.id]?.trim()
                              }
                              onClick={() => addComment(checkin.id)}
                            >
                              <Send className="size-4" />
                              Add Feedback
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
