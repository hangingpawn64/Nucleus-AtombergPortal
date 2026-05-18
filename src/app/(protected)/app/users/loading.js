import { TableSkeleton } from "@/components/loaders/skeleton-loader";

export default function UsersLoading() {
  return <TableSkeleton rows={6} cols={4} />;
}
