import { TableSkeleton } from "@/components/shared/skeleton-loader";

export default function TeamGoalsLoading() {
  return <TableSkeleton rows={5} cols={4} />;
}
