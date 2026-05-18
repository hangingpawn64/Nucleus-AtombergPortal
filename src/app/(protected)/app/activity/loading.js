import { TableSkeleton } from "@/components/loaders/skeleton-loader";

export default function ActivityLoading() {
  return <TableSkeleton rows={5} cols={4} />;
}
