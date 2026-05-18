import { TableSkeleton } from "@/components/shared/skeleton-loader";

export default function AnalyticsLoading() {
  return <TableSkeleton rows={6} cols={5} />;
}
