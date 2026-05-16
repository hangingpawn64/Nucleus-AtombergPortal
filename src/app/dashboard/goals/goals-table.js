"use client";

import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";

export function GoalsTable({ goals }) {
  const columns = [
    { key: "title", header: "Goal Title" },
    { key: "thrust_area", header: "Thrust Area" },
    { 
      key: "weightage", 
      header: "Weightage", 
      render: (row) => `${row.weightage || 0}%` 
    },
    { key: "target_value", header: "Target" },
    { 
      key: "status", 
      header: "Status", 
      render: (row) => <StatusBadge status={row.status || "not_started"} /> 
    },
  ];

  return <DataTable data={goals} columns={columns} searchableKeys={["title", "thrust_area"]} searchPlaceholder="Search goals" />;
}
