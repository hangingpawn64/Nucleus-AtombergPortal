import { TableSkeleton } from "@/components/shared/skeleton-loader";

export default function NotificationsLoading() {
  return <TableSkeleton rows={4} cols={3} />;
}
