"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pagination({
  page = 1,
  pageCount = 1,
  onPageChange,
  className,
}) {
  const canPrevious = page > 1;
  const canNext = page < pageCount;

  return (
    <nav
      className={className}
      aria-label="Pagination"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Page {page} of {Math.max(pageCount, 1)}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canPrevious}
            onClick={() => onPageChange?.(page - 1)}
          >
            <ChevronLeft />
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canNext}
            onClick={() => onPageChange?.(page + 1)}
          >
            Next
            <ChevronRight />
          </Button>
        </div>
      </div>
    </nav>
  );
}
