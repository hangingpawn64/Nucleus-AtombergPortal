import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ErrorState({
  title = "Something went wrong",
  description = "Try again or check the application logs.",
  retry,
  className,
}) {
  return (
    <div
      className={cn(
        "flex min-h-52 flex-col items-center justify-center rounded-lg border border-destructive/30 bg-card p-8 text-center",
        className,
      )}
    >
      <AlertCircle className="mb-3 size-8 text-destructive" />
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {retry && (
        <Button className="mt-4" type="button" variant="outline" onClick={retry}>
          Retry
        </Button>
      )}
    </div>
  );
}
