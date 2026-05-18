import { TableSkeleton } from "@/components/loaders/skeleton-loader";

export default function ApprovalsLoading() {
  return <TableSkeleton rows={4} cols={5} />;
}
