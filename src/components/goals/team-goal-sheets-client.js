"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Clock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, personName } from "@/lib/utils";

const statuses = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "rework", label: "Needs rework" },
  { value: "approved", label: "Approved" },
];

function totalWeightage(sheet) {
  return (sheet.goals || []).reduce((sum, goal) => sum + Number(goal.weightage || 0), 0);
}

export function TeamGoalSheetsClient({
  sheets = [],
  initialStatus = "all",
  title = "Team Goals",
  description = "Track assigned employee goal sheets and approval status.",
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(initialStatus);

  const filteredSheets = useMemo(() => {
    return sheets.filter((sheet) => {
      const employeeName = personName(sheet.employee, sheet.employee?.email).toLowerCase();
      const matchesQuery =
        !query ||
        employeeName.includes(query.toLowerCase()) ||
        sheet.employee?.email?.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === "all" || sheet.status === status;

      return matchesQuery && matchesStatus;
    });
  }, [query, sheets, status]);

  const counts = useMemo(
    () => ({
      submitted: sheets.filter((sheet) => sheet.status === "submitted").length,
      rework: sheets.filter((sheet) => sheet.status === "rework").length,
      approved: sheets.filter((sheet) => sheet.status === "approved").length,
    }),
    [sheets],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:w-[520px]">
          <Card className="rounded-md">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 text-2xl font-semibold">
              {counts.submitted}
            </CardContent>
          </Card>
          <Card className="rounded-md">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs text-muted-foreground">Rework</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 text-2xl font-semibold">
              {counts.rework}
            </CardContent>
          </Card>
          <Card className="rounded-md">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs text-muted-foreground">Approved</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 text-2xl font-semibold">
              {counts.approved}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search employees"
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="md:w-52">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredSheets.length === 0 ? (
        <EmptyState
          title="No goal sheets found"
          description="Assigned employee submissions will appear here when they match the selected filters."
        />
      ) : (
        <div className="grid gap-4">
          {filteredSheets.map((sheet) => (
            <Card key={sheet.id} className="rounded-md">
              <CardContent className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-center">
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-semibold">
                      {personName(sheet.employee, sheet.employee?.email)}
                    </h2>
                    <StatusBadge status={sheet.status} />
                  </div>
                  <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
                    <span>{sheet.employee?.email || "No email"}</span>
                    <span>{sheet.cycle?.name || sheet.goal_cycles?.name || "No cycle"}</span>
                    <span>{(sheet.goals || []).length} goals</span>
                    <span>{totalWeightage(sheet)}% weightage</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    <span>
                      Submitted {formatDate(sheet.submitted_at || sheet.updated_at)}
                    </span>
                  </div>
                </div>
                <Button asChild variant={sheet.status === "submitted" ? "default" : "outline"}>
                  <Link href={`/app/team-goals/${sheet.id}`}>
                    Open review
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
