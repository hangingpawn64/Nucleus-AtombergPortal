import { TableSkeleton } from "@/components/shared/skeleton-loader";

export default function ActivityLoading() {
  return <TableSkeleton rows={5} cols={4} />;
}
