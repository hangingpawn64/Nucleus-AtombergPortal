"use client";

import { DataTable } from "@/components/shared/data-table";
import { sampleLogs } from "@/constants/mock-data";
import { formatDate } from "@/lib/utils";

const columns = [
  { key: "action", header: "Action" },
  { key: "actor", header: "Actor" },
  {
    key: "created_at",
    header: "Created",
    render: (row) => formatDate(row.created_at),
  },
];

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity logs</h1>
        <p className="text-sm text-muted-foreground">
          Audit trail foundation for reusable portal events.
        </p>
      </div>
      <DataTable
        columns={columns}
        data={sampleLogs}
        searchableKeys={["action", "actor"]}
        searchPlaceholder="Search activity"
      />
    </div>
  );
}
