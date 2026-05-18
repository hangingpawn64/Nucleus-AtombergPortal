import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function MetricCardSkeleton() {
  return (
    <Card className="rounded-md overflow-hidden border bg-card relative">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/10 to-transparent -translate-x-full animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
      <CardHeader className="space-y-2">
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-3 w-3/4" />
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Grid of 4 Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>

      {/* Primary Action Card Skeleton */}
      <Card className="rounded-md border bg-card">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-32 rounded-md shrink-0" />
        </CardContent>
      </Card>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full space-y-4">
      {/* Table Actions Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Table Outline */}
      <div className="rounded-md border bg-card overflow-hidden">
        {/* Header Row */}
        <div className="flex border-b bg-muted/50 p-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1 mr-4 last:mr-0" />
          ))}
        </div>

        {/* Data Rows */}
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex p-4 items-center">
              {Array.from({ length: cols }).map((_, c) => (
                <Skeleton key={c} className="h-4 flex-1 mr-4 last:mr-0" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function GoalSheetSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Goal Sheet Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>

      {/* Meta Info Section */}
      <Card className="rounded-md border bg-card p-5">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </Card>

      {/* Goals List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>

        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="rounded-md border bg-card p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="flex flex-wrap gap-4 md:flex-col md:items-end">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
