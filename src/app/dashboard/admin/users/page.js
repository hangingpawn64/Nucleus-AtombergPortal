"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { sampleUsers } from "@/constants/mock-data";

const columns = [
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  {
    key: "role",
    header: "Role",
    render: (row) => <Badge variant="secondary">{row.role}</Badge>,
  },
  {
    key: "status",
    header: "Status",
    render: (row) => <Badge variant="outline">{row.status}</Badge>,
  },
];

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">User management</h1>
        <p className="text-sm text-muted-foreground">
          Replace the sample data with Supabase-powered user queries.
        </p>
      </div>
      <DataTable
        columns={columns}
        data={sampleUsers}
        searchableKeys={["name", "email", "role", "status"]}
        searchPlaceholder="Search users"
      />
    </div>
  );
}
