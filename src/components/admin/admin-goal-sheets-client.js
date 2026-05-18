"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, LockOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/badges/status-badge";
import { GoalService } from "@/services/goal.service";
import { formatDate, personName } from "@/lib/utils";

export function AdminGoalSheetsClient({ initialSheets = [] }) {
  const [sheets, setSheets] = useState(initialSheets);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [unlockComment, setUnlockComment] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);

  async function unlockSheet() {
    if (!selectedSheet) return;

    try {
      setIsUnlocking(true);
      await GoalService.unlockGoalSheet(selectedSheet.id, unlockComment);
      setSheets((current) =>
        current.map((sheet) =>
          sheet.id === selectedSheet.id
            ? { ...sheet, status: "rework", locked: false }
            : sheet,
        ),
      );
      setSelectedSheet(null);
      setUnlockComment("");
      toast.success("Goal sheet unlocked");
    } catch (error) {
      toast.error(error.message || "Could not unlock goal sheet");
    } finally {
      setIsUnlocking(false);
    }
  }

  const columns = [
    {
      key: "employee",
      header: "Employee",
      render: (row) => personName(row.employee, row.employee?.email),
    },
    {
      key: "manager",
      header: "Manager",
      render: (row) => personName(row.manager, "Unassigned"),
    },
    {
      key: "cycle",
      header: "Cycle",
      render: (row) => row.cycle?.name || "No cycle",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "submitted_at",
      header: "Submitted",
      render: (row) => formatDate(row.submitted_at),
    },
    {
      key: "goals",
      header: "Goals",
      render: (row) => (row.goals || []).length,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/app/team-goals/${row.id}`}>
              <Eye className="size-4" />
              Review
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={row.status !== "approved" && !row.locked}
            onClick={() => setSelectedSheet(row)}
          >
            <LockOpen className="size-4" />
            Unlock
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={sheets}
        searchableKeys={["employee_search", "manager_search", "status"]}
        searchPlaceholder="Search goals"
        pageSize={10}
      />

      <Dialog open={Boolean(selectedSheet)} onOpenChange={() => setSelectedSheet(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock approved goal sheet</DialogTitle>
            <DialogDescription>
              Unlocking moves the sheet back to rework so the employee can edit and resubmit it.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={unlockComment}
            onChange={(event) => setUnlockComment(event.target.value)}
            placeholder="Optional reason for the unlock"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isUnlocking}
              onClick={() => setSelectedSheet(null)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={isUnlocking} onClick={unlockSheet}>
              {isUnlocking ? "Unlocking..." : "Unlock"}
              <LockOpen className="size-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
