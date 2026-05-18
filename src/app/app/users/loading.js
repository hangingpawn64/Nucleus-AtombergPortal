import { TableSkeleton } from "@/components/shared/skeleton-loader";

export default function UsersLoading() {
  return <TableSkeleton rows={6} cols={4} />;
}
