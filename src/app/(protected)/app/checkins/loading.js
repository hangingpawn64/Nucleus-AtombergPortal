import { TableSkeleton } from "@/components/loaders/skeleton-loader";

export default function CheckinsLoading() {
  return <TableSkeleton rows={4} cols={4} />;
}
