"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  MessageSquare,
  Send,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/profile/user-avatar";
import { GoalService } from "@/services/goal";
import { formatDate, formatDateTime, personName } from "@/lib/utils";

function totalWeightage(goals = []) {
  return goals.reduce((sum, goal) => sum + Number(goal.weightage || 0), 0);
}

function commentTone(type) {
  if (type === "rework") return "border-orange-200 bg-orange-50";
  if (type === "approval") return "border-green-200 bg-green-50";
  if (type === "unlock") return "border-blue-200 bg-blue-50";
  return "border-border bg-muted/30";
}

export function GoalReviewClient({ sheet }) {
  const router = useRouter();
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [reworkOpen, setReworkOpen] = useState(false);
  const [approvalNote, setApprovalNote] = useState("");
  const [reworkComment, setReworkComment] = useState("");
  const [generalComment, setGeneralComment] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  const goals = sheet.goals || [];
  const comments = sheet.comments || [];
  const canReview = sheet.status === "submitted";
  const employeeName = personName(sheet.employee, sheet.employee?.email);

  async function handleApprove() {
    try {
      setIsWorking(true);
      await GoalService.approveGoalSheet(sheet.id, approvalNote);
      toast.success("Goal sheet approved");
      setApprovalOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Could not approve goal sheet");
    } finally {
      setIsWorking(false);
    }
  }

  async function handleRework() {
    try {
      setIsWorking(true);
      await GoalService.requestRework(sheet.id, reworkComment);
      toast.success("Goal sheet returned for rework");
      setReworkOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Could not request rework");
    } finally {
      setIsWorking(false);
    }
  }

  async function handleAddComment() {
    if (!generalComment.trim()) return;

    try {
      setIsWorking(true);
      await GoalService.addReviewComment(sheet.id, generalComment.trim());
      setGeneralComment("");
      toast.success("Review note added");
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Could not add review note");
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Review Goals: {employeeName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {sheet.cycle?.name || "Current cycle"} - {sheet.employee?.email}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={sheet.status} />
          {sheet.locked && (
            <span className="inline-flex items-center gap-1 rounded-md border bg-muted px-2 py-1 text-xs text-muted-foreground">
              <Lock className="size-3" />
              Locked
            </span>
          )}
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle>Employee Details</CardTitle>
              <CardDescription>Submission and ownership context.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-muted-foreground">Employee</p>
                <p className="font-medium">{employeeName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Manager</p>
                <p className="font-medium">{personName(sheet.manager, "Unassigned")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Submitted</p>
                <p className="font-medium">{formatDate(sheet.submitted_at)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Weightage</p>
                <p className="font-medium">{totalWeightage(goals)}% / 100%</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {goals.map((goal, index) => (
              <Card key={goal.id || index} className="rounded-md">
                <CardHeader>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {index + 1}. {goal.title}
                      </CardTitle>
                      <CardDescription>{goal.thrust_area}</CardDescription>
                    </div>
                    <span className="rounded-md border px-2 py-1 text-sm font-medium">
                      {goal.weightage}%
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 text-sm md:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground">UoM</p>
                    <p className="font-medium capitalize">{goal.uom_type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Target</p>
                    <p className="font-medium">{goal.target_value ?? "Timeline based"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Deadline</p>
                    <p className="font-medium">{formatDate(goal.deadline)}</p>
                  </div>
                  {goal.description && (
                    <div className="md:col-span-3">
                      <p className="text-muted-foreground">Description</p>
                      <p className="mt-1 leading-6">{goal.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle>Approval Controls</CardTitle>
              <CardDescription>
                Only submitted goal sheets can be approved or returned.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!canReview && (
                <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                  This sheet is currently {sheet.status}. Review actions are available only after submission.
                </div>
              )}
              <Button
                type="button"
                className="w-full"
                disabled={!canReview}
                onClick={() => setApprovalOpen(true)}
              >
                <CheckCircle2 className="size-4" />
                Approve
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={!canReview}
                onClick={() => setReworkOpen(true)}
              >
                <Undo2 className="size-4" />
                Send for Rework
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle>Review Notes</CardTitle>
              <CardDescription>Feedback is visible to the employee.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={generalComment}
                onChange={(event) => setGeneralComment(event.target.value)}
                placeholder="Add a review note"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isWorking || !generalComment.trim()}
                onClick={handleAddComment}
              >
                <MessageSquare className="size-4" />
                Add Note
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle>Comment History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No review comments yet.</p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`rounded-md border p-3 ${commentTone(comment.comment_type)}`}
                  >
                    <div className="flex items-start gap-3">
                      <UserAvatar person={comment.author} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium capitalize">
                            {comment.comment_type} note
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(comment.created_at)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6">{comment.comment}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {personName(comment.author, "Reviewer")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </section>

      <Dialog open={approvalOpen} onOpenChange={setApprovalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve goal sheet</DialogTitle>
            <DialogDescription>
              Approval locks this sheet. Employees cannot edit approved goals unless an admin unlocks it.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={approvalNote}
            onChange={(event) => setApprovalNote(event.target.value)}
            placeholder="Optional approval note"
          />
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isWorking} onClick={() => setApprovalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={isWorking} onClick={handleApprove}>
              {isWorking ? "Approving..." : "Approve"}
              <CheckCircle2 className="size-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reworkOpen} onOpenChange={setReworkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send for rework</DialogTitle>
            <DialogDescription>
              A clear comment is required so the employee knows what to fix before resubmitting.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reworkComment}
            onChange={(event) => setReworkComment(event.target.value)}
            placeholder="Explain what needs to change"
          />
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isWorking} onClick={() => setReworkOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isWorking || !reworkComment.trim()}
              onClick={handleRework}
            >
              {isWorking ? "Sending..." : "Send for Rework"}
              <Send className="size-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
