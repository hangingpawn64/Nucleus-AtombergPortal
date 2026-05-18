import { TableSkeleton } from "@/components/shared/skeleton-loader";

export default function CheckinsLoading() {
  return <TableSkeleton rows={4} cols={4} />;
}
