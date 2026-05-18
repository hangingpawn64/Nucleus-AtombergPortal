import { TableSkeleton } from "@/components/loaders/skeleton-loader";

export default function NotificationsLoading() {
  return <TableSkeleton rows={4} cols={3} />;
}
