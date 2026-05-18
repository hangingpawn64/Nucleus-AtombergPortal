import { TableSkeleton } from "@/components/loaders/skeleton-loader";

export default function CyclesLoading() {
  return <TableSkeleton rows={4} cols={4} />;
}
