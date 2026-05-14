import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  title = "No records found",
  description = "New data will appear here when it is available.",
  action,
  className,
}) {
  return (
    <div
      className={cn(
        "flex min-h-52 flex-col items-center justify-center rounded-lg border bg-card p-8 text-center",
        className,
      )}
    >
      <Inbox className="mb-3 size-8 text-muted-foreground" />
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && (
        <Button className="mt-4" type="button" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
