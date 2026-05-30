"use client";

import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  FileSpreadsheet,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-states/empty-state";
import { Pagination } from "@/components/tables/pagination";
import { StatusBadge } from "@/components/badges/status-badge";
import { cn, formatDateTime } from "@/lib/utils";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_track", label: "On Track" },
  { value: "completed", label: "Completed" },
];

const statusClasses = {
  slate: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  blue: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30",
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30",
  green: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/30",
};

function optionList(options = [], allLabel) {
  return [{ value: "all", label: allLabel }, ...options];
}

function numberLabel(value) {
  if (value == null || value === "") return "0";
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

function exportRows(rows) {
  return rows.map((row) => ({
    Employee: row.employeeName,
    Email: row.employeeEmail,
    Goal: row.goalTitle,
    Target: row.targetValue,
    Actual: row.actualAchievement,
    Progress: `${row.progress}%`,
    Status: row.statusLabel,
    Cycle: row.goalCycle,
    "Submission Status": row.submissionStatus,
    "Last Updated": row.lastUpdated ? formatDateTime(row.lastUpdated) : "Pending",
  }));
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function SortButton({ column, label, sort, onSort }) {
  const active = sort.key === column;
  const Icon = active ? (sort.direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 text-left font-medium"
      onClick={() => onSort(column)}
    >
      {label}
      <Icon className="size-3.5 text-muted-foreground" />
    </button>
  );
}

function ProgressCell({ value }) {
  return (
    <div className="min-w-28 space-y-1">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

function ReportStatus({ row }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium",
        statusClasses[row.statusColor] || statusClasses.slate,
      )}
    >
      {row.statusLabel}
    </span>
  );
}

export function AchievementReportsClient({
  rows = [],
  filters = {},
  currentUser,
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(null);
  const [sort, setSort] = useState({ key: "lastUpdated", direction: "desc" });
  const [selectedFilters, setSelectedFilters] = useState(() => ({
    cycle: searchParams.get("cycle") || "all",
    employee: searchParams.get("employee") || "all",
    status: searchParams.get("status") || "all",
    team: searchParams.get("team") || "all",
    search: searchParams.get("search") || "",
  }));

  function updateFilter(key, value) {
    const nextFilters = {
      ...selectedFilters,
      [key]: value || (key === "search" ? "" : "all"),
    };
    const params = new URLSearchParams();

    Object.entries(nextFilters).forEach(([filterKey, filterValue]) => {
      if (!filterValue || filterValue === "all") return;
      params.set(filterKey, filterValue);
    });

    const queryString = params.toString();

    setSelectedFilters(nextFilters);
    setPage(1);
    window.history.replaceState(
      null,
      "",
      queryString ? `${pathname}?${queryString}` : pathname,
    );
  }

  const filteredRows = useMemo(() => {
    const query = selectedFilters.search.toLowerCase().trim();

    return rows.filter((row) => {
      const matchesCycle =
        selectedFilters.cycle === "all" ||
        row.goalCycleId === selectedFilters.cycle;
      const matchesEmployee =
        selectedFilters.employee === "all" ||
        row.employeeId === selectedFilters.employee;
      const matchesStatus =
        selectedFilters.status === "all" ||
        row.statusKey === selectedFilters.status;
      const matchesTeam =
        selectedFilters.team === "all" ||
        row.managerId === selectedFilters.team;
      const matchesSearch =
        !query ||
        [
          row.employeeName,
          row.employeeEmail,
          row.goalTitle,
          row.goalCycle,
          row.thrustArea,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));

      return (
        matchesCycle &&
        matchesEmployee &&
        matchesStatus &&
        matchesTeam &&
        matchesSearch
      );
    });
  }, [rows, selectedFilters]);

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const aValue = a[sort.key];
      const bValue = b[sort.key];
      const direction = sort.direction === "asc" ? 1 : -1;

      if (sort.key === "progress" || sort.key === "targetValue" || sort.key === "actualAchievement") {
        return (Number(aValue || 0) - Number(bValue || 0)) * direction;
      }

      if (sort.key === "lastUpdated") {
        return (
          (new Date(aValue || 0).getTime() - new Date(bValue || 0).getTime()) *
          direction
        );
      }

      return String(aValue || "").localeCompare(String(bValue || "")) * direction;
    });
  }, [filteredRows, sort]);

  const summary = useMemo(() => {
    const employeeCount = new Set(filteredRows.map((row) => row.employeeId)).size;
    const completedGoals = filteredRows.filter(
      (row) => row.statusKey === "completed",
    ).length;
    const pendingGoals = filteredRows.filter(
      (row) => row.statusKey === "pending",
    ).length;
    const averageProgress = filteredRows.length
      ? Math.round(
          filteredRows.reduce((sum, row) => sum + Number(row.progress || 0), 0) /
            filteredRows.length,
        )
      : 0;

    return {
      employeeCount,
      completedGoals,
      pendingGoals,
      averageProgress,
    };
  }, [filteredRows]);

  const pageCount = Math.max(Math.ceil(sortedRows.length / PAGE_SIZE), 1);
  const paginatedRows = sortedRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(key) {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  function exportCsv() {
    const data = exportRows(sortedRows);
    if (!data.length) {
      toast.info("No report rows match the current filters.");
      return;
    }

    setExporting("csv");
    try {
      const headers = Object.keys(data[0]);
      const csv = [
        headers.map(csvEscape).join(","),
        ...data.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
      ].join("\n");

      downloadBlob(
        new Blob([csv], { type: "text/csv;charset=utf-8;" }),
        `achievement-report-${timestamp()}.csv`,
      );
      toast.success("CSV export ready");
    } finally {
      setExporting(null);
    }
  }

  async function exportExcel() {
    const data = exportRows(sortedRows);
    if (!data.length) {
      toast.info("No report rows match the current filters.");
      return;
    }

    try {
      setExporting("excel");
      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.json_to_sheet(data);
      const headers = Object.keys(data[0]);

      headers.forEach((_, index) => {
        const cell = XLSX.utils.encode_cell({ r: 0, c: index });
        if (worksheet[cell]) {
          worksheet[cell].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "E5E7EB" } },
          };
        }
      });

      worksheet["!cols"] = headers.map((header) => ({
        wch: Math.max(
          header.length + 2,
          ...data.map((row) => String(row[header] ?? "").length + 2),
        ),
      }));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Achievement Report");
      XLSX.writeFile(workbook, `achievement-report-${timestamp()}.xlsx`);
      toast.success("Excel export ready");
    } catch (error) {
      toast.error(error.message || "Could not export Excel report");
    } finally {
      setExporting(null);
    }
  }

  const hasTeamFilter = currentUser?.role === "admin";
  const hasEmployeeFilter = currentUser?.role !== "employee";

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{summary.employeeCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">In current view</p>
          </CardContent>
        </Card>
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Completed Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{summary.completedGoals}</p>
            <p className="mt-1 text-sm text-muted-foreground">At 100% progress</p>
          </CardContent>
        </Card>
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Average Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{summary.averageProgress}%</p>
            <p className="mt-1 text-sm text-muted-foreground">Across filtered goals</p>
          </CardContent>
        </Card>
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Pending Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{summary.pendingGoals}</p>
            <p className="mt-1 text-sm text-muted-foreground">No progress yet</p>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-md">
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_repeat(4,minmax(160px,200px))]">
            <div className="space-y-2">
              <Label htmlFor="report-search">Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="report-search"
                  value={selectedFilters.search}
                  onChange={(event) => updateFilter("search", event.target.value)}
                  placeholder="Search reports"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Goal Cycle</Label>
              <Select
                value={selectedFilters.cycle}
                onValueChange={(value) => updateFilter("cycle", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Goal cycle" />
                </SelectTrigger>
                <SelectContent>
                  {optionList(filters.cycles, "All cycles").map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasEmployeeFilter && (
              <div className="space-y-2">
                <Label>Employee</Label>
                <Select
                  value={selectedFilters.employee}
                  onValueChange={(value) => updateFilter("employee", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {optionList(filters.employees, "All employees").map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={selectedFilters.status}
                onValueChange={(value) => updateFilter("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasTeamFilter && (
              <div className="space-y-2">
                <Label>Team</Label>
                <Select
                  value={selectedFilters.team}
                  onValueChange={(value) => updateFilter("team", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Team" />
                  </SelectTrigger>
                  <SelectContent>
                    {optionList(filters.teams, "All teams").map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {sortedRows.length} report rows available
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={exportCsv}
                disabled={exporting != null}
              >
                <Download className="size-4" />
                {exporting === "csv" ? "Exporting..." : "CSV"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={exportExcel}
                disabled={exporting != null}
              >
                <FileSpreadsheet className="size-4" />
                {exporting === "excel" ? "Exporting..." : "Excel"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {paginatedRows.length === 0 ? (
        <EmptyState
          title="No achievement reports found"
          description="Try adjusting the filters or search term."
        />
      ) : (
        <div className="overflow-hidden rounded-md border bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortButton column="employeeName" label="Employee" sort={sort} onSort={toggleSort} />
                  </TableHead>
                  <TableHead>
                    <SortButton column="goalTitle" label="Goal" sort={sort} onSort={toggleSort} />
                  </TableHead>
                  <TableHead>
                    <SortButton column="goalCycle" label="Cycle" sort={sort} onSort={toggleSort} />
                  </TableHead>
                  <TableHead>
                    <SortButton column="targetValue" label="Target" sort={sort} onSort={toggleSort} />
                  </TableHead>
                  <TableHead>
                    <SortButton column="actualAchievement" label="Actual" sort={sort} onSort={toggleSort} />
                  </TableHead>
                  <TableHead>
                    <SortButton column="progress" label="Progress" sort={sort} onSort={toggleSort} />
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <SortButton column="lastUpdated" label="Last Updated" sort={sort} onSort={toggleSort} />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="min-w-44">
                        <p className="font-medium">{row.employeeName}</p>
                        <p className="text-xs text-muted-foreground">{row.employeeEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-56">
                        <p className="font-medium">{row.goalTitle}</p>
                        <p className="text-xs text-muted-foreground">{row.thrustArea}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-36">
                        <p>{row.goalCycle}</p>
                        <p className="text-xs text-muted-foreground">{row.goalCycleQuarter}</p>
                      </div>
                    </TableCell>
                    <TableCell>{numberLabel(row.targetValue)}</TableCell>
                    <TableCell>{numberLabel(row.actualAchievement)}</TableCell>
                    <TableCell>
                      <ProgressCell value={row.progress} />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <ReportStatus row={row} />
                        <StatusBadge status={row.submissionStatus} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="whitespace-nowrap text-sm">
                        {row.lastUpdated ? formatDateTime(row.lastUpdated) : "Pending"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
    </div>
  );
}
