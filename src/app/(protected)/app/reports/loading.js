import { TableSkeleton } from "@/components/loaders/skeleton-loader";

export default function ReportsLoading() {
  return <TableSkeleton rows={5} cols={5} />;
}
