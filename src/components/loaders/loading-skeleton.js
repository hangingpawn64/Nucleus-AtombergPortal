import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function LoadingSkeleton({ rows = 3, className }) {
  return (
    <div className={cn("space-y-3 rounded-lg border bg-card p-5", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("h-4", index === rows - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}
