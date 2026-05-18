import { TableSkeleton } from "@/components/shared/skeleton-loader";

export default function ReportsLoading() {
  return <TableSkeleton rows={5} cols={5} />;
}
