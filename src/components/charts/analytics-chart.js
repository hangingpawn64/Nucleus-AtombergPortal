"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const AnalyticsChartInner = dynamic(
  () => import("./analytics-chart-inner").then((mod) => mod.AnalyticsChartInner),
  {
    ssr: false,
    loading: () => <Skeleton className="h-72 w-full" />,
  },
);

export function AnalyticsChart({ data = [] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
        <CardDescription>Placeholder trend data for future modules.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 min-h-72 w-full min-w-0">
          <AnalyticsChartInner data={data} />
        </div>
      </CardContent>
    </Card>
  );
}
