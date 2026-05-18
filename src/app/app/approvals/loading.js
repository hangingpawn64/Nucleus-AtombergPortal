import { TableSkeleton } from "@/components/shared/skeleton-loader";

export default function ApprovalsLoading() {
  return <TableSkeleton rows={4} cols={5} />;
}
