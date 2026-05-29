"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/badges/status-badge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { GoalService } from "@/services/goal.service";

export function GoalsTable({ goals }) {
  const [rows, setRows] = useState(goals || []);
  const [busyGoalId, setBusyGoalId] = useState(null);

  async function updateWeightage(goal, value) {
    if (!goal.shared_goal_id || Number(value) === Number(goal.weightage)) return;

    try {
      setBusyGoalId(goal.id);
      const updatedGoal = await GoalService.updateSharedGoalWeightage(goal.id, value);
      setRows((current) =>
        current.map((row) =>
          row.id === updatedGoal.id
            ? { ...row, weightage: updatedGoal.weightage }
            : row,
        ),
      );
      toast.success("Shared KPI weightage updated");
    } catch (error) {
      toast.error(error.message || "Could not update weightage");
    } finally {
      setBusyGoalId(null);
    }
  }

  const columns = [
    {
      key: "title",
      header: "Goal Title",
      render: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <span>{row.title}</span>
          {row.shared_goal_id && <Badge variant="outline">Pushed KPI</Badge>}
        </div>
      ),
    },
    { key: "thrust_area", header: "Thrust Area" },
    { 
      key: "weightage", 
      header: "Weightage", 
      render: (row) =>
        row.shared_goal_id ? (
          <Input
            type="number"
            min="10"
            max="100"
            defaultValue={row.weightage || 10}
            disabled={busyGoalId === row.id}
            className="h-8 w-24"
            onBlur={(event) => updateWeightage(row, event.target.value)}
          />
        ) : (
          `${row.weightage || 0}%`
        ),
    },
    { key: "target_value", header: "Target" },
    { 
      key: "status", 
      header: "Status", 
      render: (row) => <StatusBadge status={row.status || "not_started"} /> 
    },
  ];

  return <DataTable data={rows} columns={columns} searchableKeys={["title", "thrust_area"]} searchPlaceholder="Search goals" />;
}
